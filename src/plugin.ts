import type MarkdownIt from "markdown-it";
import type { Options, PluginWithOptions } from "markdown-it";
import { isLinkClose, isLinkOpen } from "./html.ts";
import { spanHashAndTag } from "./label.ts";

type Renderer = MarkdownIt["renderer"];
type Token = ReturnType<MarkdownIt["parseInline"]>[number];
type StateCore = Parameters<MarkdownIt["core"]["process"]>[0];

/**
 * Options for the plugin.
 */
export interface PluginOptions {
  /**
   * A function to render a link href for a hashtag.  If it returns `null`,
   * the hashtag will be rendered as plain text.  `#${tag}` by default.
   */
  // deno-lint-ignore no-explicit-any
  link?: (tag: string, env: any) => string | null;

  /**
   * A function to render extra attributes for a hashtag link.
   */
  // deno-lint-ignore no-explicit-any
  linkAttributes?: (handle: string, env: any) => Record<string, string>;

  /**
   * A function to render a label for a hashtag link.  {@link spanHashAndTag}
   * by default.
   */
  // deno-lint-ignore no-explicit-any
  label?: (handle: string, env: any) => string;
}

/**
 * A markdown-it plugin to parse and render Mastodon-style hashtags.
 */
export const hashtag: PluginWithOptions<PluginOptions> = (
  md: MarkdownIt,
  options?: PluginOptions,
): void => {
  md.core.ruler.after(
    "inline",
    "hashtag",
    (state: StateCore) => parseHashtag(state, options),
  );
  md.renderer.rules.hashtag = renderHashtag;
};

function parseHashtag(state: StateCore, options?: PluginOptions) {
  for (const blockToken of state.tokens) {
    if (blockToken.type !== "inline") continue;
    if (blockToken.children == null) continue;
    let linkDepth = 0;
    let htmlLinkDepth = 0;
    blockToken.children = blockToken.children.flatMap((token: Token) => {
      if (token.type === "link_open") {
        linkDepth++;
      } else if (token.type === "link_close") {
        linkDepth--;
      } else if (token.type === "html_inline") {
        if (isLinkOpen(token.content)) {
          htmlLinkDepth++;
        } else if (isLinkClose(token.content)) {
          htmlLinkDepth--;
        }
      }
      if (
        linkDepth > 0 || htmlLinkDepth > 0 || token.type !== "text"
      ) {
        return [token];
      }
      return splitTokens(token, state, options);
    });
  }
}

const HASHTAG_PATTERN = /#[\w\p{L}]+/giu;

function splitTokens(
  token: Token,
  state: StateCore,
  options?: PluginOptions,
): Token[] {
  const { content, level } = token;
  const tokens = [];
  let pos = 0;
  for (const match of content.matchAll(HASHTAG_PATTERN)) {
    if (match.index == null) continue;

    if (match.index > pos) {
      const token = new state.Token("text", "", 0);
      token.content = content.substring(pos, match.index);
      token.level = level;
      tokens.push(token);
    }

    const href = options?.link?.(match[0], state.env);
    if (href == null && options?.link != null) {
      const token = new state.Token("text", "", 0);
      token.content = match[0];
      token.level = level;
      tokens.push(token);
      pos = match.index + match[0].length;
      continue;
    }

    const token = new state.Token("hashtag", "", 0);
    token.content = options?.label?.(match[0], state.env) ??
      spanHashAndTag(match[0]);
    token.level = level;
    const attrs = options?.linkAttributes?.(match[0], state.env) ?? {};
    attrs.href = href ?? `${match[0]}`;
    token.attrs = Object.entries(attrs);
    token.info = match[0];
    tokens.push(token);
    pos = match.index + match[0].length;
  }

  if (pos < content.length) {
    const token = new state.Token("text", "", 0);
    token.content = content.substring(pos);
    token.level = level;
    tokens.push(token);
  }

  return tokens;
}

function renderHashtag(
  tokens: Token[],
  idx: number,
  opts: Options,
  // deno-lint-ignore no-explicit-any
  env: any,
  self: Renderer,
): string {
  if (tokens.length <= idx) return "";
  const token = tokens[idx];
  if (token.type !== "hashtag") return self.renderToken(tokens, idx, opts);
  if (typeof env === "object" && env !== null) {
    if (!("hashtags" in env)) {
      env.hashtags = [];
    }
    env.hashtags.push(token.info);
  }
  return `<a ${self.renderAttrs(token)}>${token.content}</a>`;
}
