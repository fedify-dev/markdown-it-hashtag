import { assertEquals } from "@std/assert/assert-equals";
import MarkdownIt from "markdown-it-impl";
import { hashtag } from "./plugin.ts";

Deno.test("hashtag()", () => {
  const md = new MarkdownIt({
    html: true,
  });
  md.use(hashtag);
  // deno-lint-ignore no-explicit-any
  const env: any = {};
  const html = md.render(
    `\
**Hello**, *#FooBar*!

> #Baz_Qux
>
> #테스트

[This should be ignored: #FooBar](https://example.com/)

<a href="">This also should be ignored: #FooBar</a>
`,
    env,
  );
  assertEquals(env.hashtags, [
    "#FooBar",
    "#Baz_Qux",
    "#테스트",
  ]);
  assertEquals(
    html,
    `\
<p><strong>Hello</strong>, <em><a  href="#FooBar"><span class="hash">#</span><span class="tag">FooBar</span></a></em>!</p>
<blockquote>
<p><a  href="#Baz_Qux"><span class="hash">#</span><span class="tag">Baz_Qux</span></a></p>
<p><a  href="#테스트"><span class="hash">#</span><span class="tag">테스트</span></a></p>
</blockquote>
<p><a href="https://example.com/">This should be ignored: #FooBar</a></p>
<p><a href="">This also should be ignored: #FooBar</a></p>
`,
  );

  const md2 = new MarkdownIt()
    .use(hashtag, {
      // deno-lint-ignore no-explicit-any
      link(tag: string, env: any): string | null {
        if (
          !env.allowedPrefixes.some((prefix: string) => tag.startsWith(prefix))
        ) {
          return null;
        }
        return new URL(
          `/tags/${encodeURIComponent(tag.substring(1))}`,
          env.origin,
        ).href;
      },
    });
  // deno-lint-ignore no-explicit-any
  const env2: any = {
    origin: "https://example.com",
    allowedPrefixes: ["#Foo", "#Baz"],
  };
  const html2 = md2.render(
    "- #FooBar\n- #Baz_Qux\n- #테스트\n- #Quux",
    env2,
  );
  assertEquals(env2.hashtags, ["#FooBar", "#Baz_Qux"]);
  assertEquals(
    html2,
    `\
<ul>
<li><a  href="https://example.com/tags/FooBar"><span class="hash">#</span><span class="tag">FooBar</span></a></li>
<li><a  href="https://example.com/tags/Baz_Qux"><span class="hash">#</span><span class="tag">Baz_Qux</span></a></li>
<li>#테스트</li>
<li>#Quux</li>
</ul>
`,
  );
});
