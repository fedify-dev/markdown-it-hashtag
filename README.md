<!-- deno-fmt-ignore-file -->

@fedify/markdown-it-hashtag
===========================

[![JSR][JSR badge]][JSR]
[![npm][npm badge]][npm]
[![GitHub Actions][GitHub Actions badge]][GitHub Actions]

This is a [markdown-it] plugin that parses and renders Mastodon-style #hashtags.
It converts, for example, `#FooBar` into a link:

~~~~ html
<a href="#FooBar"><span class="hash">#</span><span class="tag">FooBar</span></a>
~~~~

The value of `href` attributes, other attributes (if any), and the content of
the link can be customized by passing [options] to the plugin:

~~~~ typescript
import MarkdownIt from "markdown-it";
import { hashtag, spanHashAndTag } from "@fedify/markdown-it-hashtag";

const md = new MarkdownIt();
md.use(hashtag, {
  link: (tag: string) => `https://example.com/tags/${tag.substring(1)}`,
  linkAttributes: (handle: string) => ({ class: "hashtag" }),
  label: spanHashAndTag,
});
~~~~

If you want to collect all hashtags in a document, you can pass an environment
object to the `render()` method:

~~~~ typescript
const env = {};
md.render(
  "Hello, #FooBar\n\n> #BazQux",
  env,
);
console.log(env.hashtags);  // ["#FooBar", "#BazQux"]
~~~~

[JSR]: https://jsr.io/@fedify/markdown-it-hashtag
[JSR badge]: https://jsr.io/badges/@fedify/markdown-it-hashtag
[npm]: https://www.npmjs.com/package/@fedify/markdown-it-hashtag
[npm badge]: https://img.shields.io/npm/v/%40fedify%2Fmarkdown-it-hashtag?logo=npm
[GitHub Actions]: https://github.com/fedify-dev/markdown-it-hashtag/actions/workflows/main.yaml
[GitHub Actions badge]: https://github.com/fedify-dev/markdown-it-hashtag/actions/workflows/main.yaml/badge.svg
[markdown-it]: https://github.com/markdown-it/markdown-it
[options]: https://jsr.io/@fedify/markdown-it-hashtag/doc/~/PluginOptions


Installation
------------

### Deno

~~~~ sh
deno add @fedify/markdown-it-hashtag
~~~~

### Node.js

~~~~ sh
npm add @fedify/markdown-it-hashtag
~~~~

### Bun

~~~~ sh
bun add @fedify/markdown-it-hashtag
~~~~
