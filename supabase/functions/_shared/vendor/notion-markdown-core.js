// Package/ReactNativeNotionMarkdown/Distribution/Colors.js
var NotionColors = [
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red"
];
var ColorValueSet = /* @__PURE__ */ new Set([
  "default",
  ...NotionColors,
  ...NotionColors.map((Color) => `${Color}_bg`)
]);
function IsColorValue(Value) {
  return ColorValueSet.has(Value);
}

// Package/ReactNativeNotionMarkdown/Distribution/Escape.js
var EscapableCharacters = /* @__PURE__ */ new Set([
  "\\",
  "*",
  "~",
  "`",
  "$",
  "[",
  "]",
  "<",
  ">",
  "{",
  "}",
  "|",
  "^"
]);
function EscapeText(Text) {
  let Result = "";
  for (const Character of Text) {
    if (EscapableCharacters.has(Character))
      Result += "\\";
    Result += Character;
  }
  return Result;
}

// Package/ReactNativeNotionMarkdown/Distribution/Parser.js
var HeadingPattern = /^(#{1,4})\s+(.*)$/;
var ToDoPattern = /^-\s\[([ xX])\]\s+(.*)$/;
var BulletedListPattern = /^-\s+(.*)$/;
var NumberedListPattern = /^\d+\.\s+(.*)$/;
var QuotePattern = /^>\s?(.*)$/;
var DividerPattern = /^---$/;
var FenceOpenPattern = /^```(\S*)\s*$/;
var FenceClosePattern = /^```\s*$/;
var EquationFencePattern = /^\$\$$/;
var CalloutOpenPattern = /^<callout([^>]*)>$/;
var DetailsOpenPattern = /^<details([^>]*)>$/;
var SummaryPattern = /^<summary>(.*)<\/summary>$/;
var BlockColorPattern = /^(.*)\{color="([a-z_]+)"\}$/;
function StripIndentation(Line) {
  let Depth = 0;
  while (Depth < Line.length && Line[Depth] === "	")
    Depth += 1;
  return { Depth, Rest: Line.slice(Depth) };
}
function ParseTagAttributes(AttributeText) {
  const Attributes = /* @__PURE__ */ new Map();
  const Pattern = /(\w+)="([^"]*)"/g;
  let Match;
  while ((Match = Pattern.exec(AttributeText)) !== null) {
    Attributes.set(Match[1], Match[2]);
  }
  return Attributes;
}
function ReadColorAttribute(Attributes) {
  const Value = Attributes.get("color");
  return Value !== void 0 && IsColorValue(Value) ? Value : void 0;
}
function ExtractBlockColor(Rest) {
  const Match = BlockColorPattern.exec(Rest);
  if (Match) {
    const Candidate = Match[2];
    if (IsColorValue(Candidate)) {
      return { Rest: Match[1].replace(/\s+$/, ""), Color: Candidate };
    }
  }
  return { Rest, Color: void 0 };
}
function Parse(Source) {
  const Lines = Source.split(/\r\n|\r|\n/);
  const Blocks = [];
  let Index = 0;
  while (Index < Lines.length) {
    const RawLine = Lines[Index];
    if (RawLine.trim().length === 0) {
      Index += 1;
      continue;
    }
    const { Depth, Rest: IndentStrippedRest } = StripIndentation(RawLine);
    const FenceOpen = FenceOpenPattern.exec(IndentStrippedRest);
    if (FenceOpen) {
      const Language = FenceOpen[1].length > 0 ? FenceOpen[1] : null;
      const ContentLines = [];
      Index += 1;
      while (Index < Lines.length && !FenceClosePattern.test(StripIndentation(Lines[Index]).Rest)) {
        ContentLines.push(Lines[Index]);
        Index += 1;
      }
      if (Index < Lines.length)
        Index += 1;
      Blocks.push({ Type: "Code", Depth, Language, Text: ContentLines.join("\n") });
      continue;
    }
    if (DividerPattern.test(IndentStrippedRest)) {
      Blocks.push({ Type: "Divider", Depth });
      Index += 1;
      continue;
    }
    const CalloutOpen = CalloutOpenPattern.exec(IndentStrippedRest);
    if (CalloutOpen) {
      const Attributes = ParseTagAttributes(CalloutOpen[1]);
      const Icon = Attributes.get("icon") ?? null;
      const Color = ReadColorAttribute(Attributes);
      Blocks.push({ Type: "Callout", Depth, Icon, ...Color !== void 0 ? { Color } : {} });
      Index += 1;
      continue;
    }
    const DetailsOpen = DetailsOpenPattern.exec(IndentStrippedRest);
    if (DetailsOpen) {
      const Attributes = ParseTagAttributes(DetailsOpen[1]);
      const Color = ReadColorAttribute(Attributes);
      Index += 1;
      let Content = [];
      if (Index < Lines.length) {
        const Next = StripIndentation(Lines[Index]);
        if (Next.Depth === Depth) {
          const SummaryMatch = SummaryPattern.exec(Next.Rest);
          if (SummaryMatch) {
            Content = ParseInline(SummaryMatch[1]);
            Index += 1;
          }
        }
      }
      Blocks.push({ Type: "Toggle", Depth, Content, ...Color !== void 0 ? { Color } : {} });
      continue;
    }
    if (IndentStrippedRest === "</callout>" || IndentStrippedRest === "</details>") {
      Index += 1;
      continue;
    }
    if (EquationFencePattern.test(IndentStrippedRest)) {
      const ExpressionLines = [];
      Index += 1;
      while (Index < Lines.length && !EquationFencePattern.test(StripIndentation(Lines[Index]).Rest)) {
        ExpressionLines.push(Lines[Index]);
        Index += 1;
      }
      if (Index < Lines.length)
        Index += 1;
      Blocks.push({ Type: "Equation", Depth, Expression: ExpressionLines.join("\n") });
      continue;
    }
    const { Rest, Color: BlockColor } = ExtractBlockColor(IndentStrippedRest);
    const ColorField2 = BlockColor !== void 0 ? { Color: BlockColor } : {};
    const Heading = HeadingPattern.exec(Rest);
    if (Heading) {
      const Level = Heading[1].length;
      Blocks.push({ Type: "Heading", Depth, Level, ...ColorField2, Content: ParseInline(Heading[2]) });
      Index += 1;
      continue;
    }
    const ToDo = ToDoPattern.exec(Rest);
    if (ToDo) {
      Blocks.push({
        Type: "ToDo",
        Depth,
        Checked: ToDo[1].toLowerCase() === "x",
        ...ColorField2,
        Content: ParseInline(ToDo[2])
      });
      Index += 1;
      continue;
    }
    const Bulleted = BulletedListPattern.exec(Rest);
    if (Bulleted) {
      Blocks.push({ Type: "BulletedListItem", Depth, ...ColorField2, Content: ParseInline(Bulleted[1]) });
      Index += 1;
      continue;
    }
    const Numbered = NumberedListPattern.exec(Rest);
    if (Numbered) {
      Blocks.push({ Type: "NumberedListItem", Depth, ...ColorField2, Content: ParseInline(Numbered[1]) });
      Index += 1;
      continue;
    }
    const Quote = QuotePattern.exec(Rest);
    if (Quote) {
      Blocks.push({ Type: "Quote", Depth, ...ColorField2, Content: ParseInline(Quote[1]) });
      Index += 1;
      continue;
    }
    Blocks.push({ Type: "Paragraph", Depth, ...ColorField2, Content: ParseInline(Rest) });
    Index += 1;
  }
  return { Blocks };
}
function ParseInline(Text) {
  const Nodes = [];
  let Buffer = "";
  let Index = 0;
  const FlushBuffer = () => {
    if (Buffer.length > 0) {
      Nodes.push({ Type: "Text", Text: Buffer });
      Buffer = "";
    }
  };
  while (Index < Text.length) {
    const Character = Text[Index];
    if (Character === "\\" && Index + 1 < Text.length && EscapableCharacters.has(Text[Index + 1])) {
      Buffer += Text[Index + 1];
      Index += 2;
      continue;
    }
    if (Character === "`") {
      const End = Text.indexOf("`", Index + 1);
      if (End !== -1) {
        FlushBuffer();
        Nodes.push({ Type: "Code", Text: Text.slice(Index + 1, End) });
        Index = End + 1;
        continue;
      }
    }
    if (Character === "$") {
      const End = Text.indexOf("$", Index + 1);
      if (End !== -1) {
        FlushBuffer();
        Nodes.push({ Type: "Equation", Expression: Text.slice(Index + 1, End) });
        Index = End + 1;
        continue;
      }
    }
    if (Character === "<") {
      const Remainder = Text.slice(Index);
      const SpanMatch = /^<span\s+(color|underline)="([^"]*)">/.exec(Remainder);
      if (SpanMatch) {
        const AttributeName = SpanMatch[1];
        const AttributeValue = SpanMatch[2];
        const OpenTagLength = SpanMatch[0].length;
        const CloseIndex = Text.indexOf("</span>", Index + OpenTagLength);
        if (CloseIndex !== -1) {
          FlushBuffer();
          const InnerText = Text.slice(Index + OpenTagLength, CloseIndex);
          const InnerNodes = ParseInline(InnerText);
          if (AttributeName === "color" && IsColorValue(AttributeValue)) {
            Nodes.push({ Type: "Color", Color: AttributeValue, Children: InnerNodes });
          } else if (AttributeName === "underline" && AttributeValue === "true") {
            Nodes.push({ Type: "Underline", Children: InnerNodes });
          } else {
            Nodes.push(...InnerNodes);
          }
          Index = CloseIndex + "</span>".length;
          continue;
        }
      }
      if (Remainder.startsWith("<br>")) {
        FlushBuffer();
        Nodes.push({ Type: "LineBreak" });
        Index += 4;
        continue;
      }
      const MentionMatch = /^<mention-(user|page|database)\s+url="([^"]*)">(.*?)<\/mention-\1>/.exec(Remainder);
      if (MentionMatch) {
        FlushBuffer();
        const Kind = MentionMatch[1];
        Nodes.push({ Type: "Mention", MentionKind: Kind, Url: MentionMatch[2], DisplayText: MentionMatch[3] });
        Index += MentionMatch[0].length;
        continue;
      }
      const MentionDateMatch = /^<mention-date\s+start="([^"]*)"(?:\s+end="([^"]*)")?\s*\/>/.exec(Remainder);
      if (MentionDateMatch) {
        FlushBuffer();
        Nodes.push({ Type: "Mention", MentionKind: "date", Start: MentionDateMatch[1], End: MentionDateMatch[2] ?? null });
        Index += MentionDateMatch[0].length;
        continue;
      }
    }
    if (Text.startsWith("**", Index)) {
      const End = Text.indexOf("**", Index + 2);
      if (End !== -1) {
        FlushBuffer();
        Nodes.push({ Type: "Bold", Children: ParseInline(Text.slice(Index + 2, End)) });
        Index = End + 2;
        continue;
      }
    }
    if (Text.startsWith("~~", Index)) {
      const End = Text.indexOf("~~", Index + 2);
      if (End !== -1) {
        FlushBuffer();
        Nodes.push({ Type: "Strikethrough", Children: ParseInline(Text.slice(Index + 2, End)) });
        Index = End + 2;
        continue;
      }
    }
    if (Character === "*") {
      const End = Text.indexOf("*", Index + 1);
      if (End !== -1) {
        FlushBuffer();
        Nodes.push({ Type: "Italic", Children: ParseInline(Text.slice(Index + 1, End)) });
        Index = End + 1;
        continue;
      }
    }
    if (Character === "[") {
      const CloseBracket = Text.indexOf("]", Index + 1);
      if (CloseBracket !== -1 && Text[CloseBracket + 1] === "(") {
        const CloseParen = Text.indexOf(")", CloseBracket + 2);
        if (CloseParen !== -1) {
          FlushBuffer();
          const LinkText = Text.slice(Index + 1, CloseBracket);
          const Url = Text.slice(CloseBracket + 2, CloseParen);
          Nodes.push({ Type: "Link", Url, Children: ParseInline(LinkText) });
          Index = CloseParen + 1;
          continue;
        }
      }
    }
    Buffer += Character;
    Index += 1;
  }
  FlushBuffer();
  return Nodes;
}

// Package/ReactNativeNotionMarkdown/Distribution/Serializer.js
function Indent(Depth) {
  return "	".repeat(Depth);
}
function SerializeTagAttributes(Attributes) {
  let Result = "";
  for (const [Key, Value] of Object.entries(Attributes)) {
    if (Value !== void 0)
      Result += ` ${Key}="${Value}"`;
  }
  return Result;
}
function ColorAttributeSuffix(Color) {
  return Color !== void 0 ? ` {color="${Color}"}` : "";
}
function Serialize(Doc) {
  const Lines = [];
  const OpenContainers = [];
  const CloseContainersAtOrDeeperThan = (Depth) => {
    while (OpenContainers.length > 0 && OpenContainers[OpenContainers.length - 1].Depth >= Depth) {
      const Container = OpenContainers.pop();
      Lines.push(Indent(Container.Depth) + Container.ClosingTag);
    }
  };
  for (const Node of Doc.Blocks) {
    CloseContainersAtOrDeeperThan(Node.Depth);
    Lines.push(SerializeBlock(Node));
    if (Node.Type === "Callout")
      OpenContainers.push({ Depth: Node.Depth, ClosingTag: "</callout>" });
    if (Node.Type === "Toggle")
      OpenContainers.push({ Depth: Node.Depth, ClosingTag: "</details>" });
  }
  CloseContainersAtOrDeeperThan(-1);
  return Lines.join("\n");
}
function SerializeBlock(Node) {
  const Prefix = Indent(Node.Depth);
  switch (Node.Type) {
    case "Paragraph":
      return Prefix + SerializeInline(Node.Content) + ColorAttributeSuffix(Node.Color);
    case "Heading":
      return Prefix + "#".repeat(Node.Level) + " " + SerializeInline(Node.Content) + ColorAttributeSuffix(Node.Color);
    case "BulletedListItem":
      return Prefix + "- " + SerializeInline(Node.Content) + ColorAttributeSuffix(Node.Color);
    case "NumberedListItem":
      return Prefix + "1. " + SerializeInline(Node.Content) + ColorAttributeSuffix(Node.Color);
    case "ToDo":
      return Prefix + `- [${Node.Checked ? "x" : " "}] ` + SerializeInline(Node.Content) + ColorAttributeSuffix(Node.Color);
    case "Quote":
      return Prefix + "> " + SerializeInline(Node.Content) + ColorAttributeSuffix(Node.Color);
    case "Code":
      return Prefix + "```" + (Node.Language ?? "") + "\n" + Node.Text + "\n" + Prefix + "```";
    case "Divider":
      return Prefix + "---";
    case "Callout":
      return Prefix + `<callout${SerializeTagAttributes({ icon: Node.Icon ?? void 0, color: Node.Color })}>`;
    case "Toggle":
      return Prefix + `<details${SerializeTagAttributes({ color: Node.Color })}>
` + Prefix + `<summary>${SerializeInline(Node.Content)}</summary>`;
    case "Equation":
      return Prefix + "$$\n" + Node.Expression + "\n" + Prefix + "$$";
  }
}
function SerializeInline(Nodes) {
  return Nodes.map(SerializeInlineNode).join("");
}
function SerializeInlineNode(Node) {
  switch (Node.Type) {
    case "Text":
      return EscapeText(Node.Text);
    case "Bold":
      return "**" + SerializeInline(Node.Children) + "**";
    case "Italic":
      return "*" + SerializeInline(Node.Children) + "*";
    case "Strikethrough":
      return "~~" + SerializeInline(Node.Children) + "~~";
    case "Underline":
      return `<span underline="true">${SerializeInline(Node.Children)}</span>`;
    case "Code":
      return "`" + Node.Text + "`";
    case "Link":
      return "[" + SerializeInline(Node.Children) + "](" + Node.Url + ")";
    case "Color":
      return `<span color="${Node.Color}">${SerializeInline(Node.Children)}</span>`;
    case "Equation":
      return "$" + Node.Expression + "$";
    case "LineBreak":
      return "<br>";
    case "Mention":
      if (Node.MentionKind === "date") {
        return Node.End !== null ? `<mention-date start="${Node.Start}" end="${Node.End}"/>` : `<mention-date start="${Node.Start}"/>`;
      }
      return `<mention-${Node.MentionKind} url="${Node.Url}">${Node.DisplayText}</mention-${Node.MentionKind}>`;
  }
}

// Package/ReactNativeNotionMarkdown/Distribution/NotionBridge.js
var MaxRichTextLength = 2e3;
var MaxBlockChildren = 100;
var MaxRichTextItems = 100;
var MaxEquationLength = 1e3;
var MaxUrlLength = 2e3;
var MaxBlockTextLength = 5e4;
function GetNotionBlockChildren(Node) {
  const Content = Node[Node.type];
  const Beside = Node.children;
  return Content?.children ?? Beside ?? [];
}
function WithNotionBlockChildren(Node, Children) {
  const { children: _Beside, ...Rest } = Node;
  const Record_ = Rest;
  const { children: _Inside, ...Content } = Record_[Node.type];
  return { ...Rest, [Node.type]: Children.length > 0 ? { ...Content, children: [...Children] } : Content };
}
function ColorValueToApiColor(Color) {
  return Color.endsWith("_bg") ? Color.replace(/_bg$/, "_background") : Color;
}
function ApiColorToColorValue(Color) {
  const Value = Color.endsWith("_background") ? Color.replace(/_background$/, "_bg") : Color;
  return IsColorValue(Value) ? Value : "default";
}
function ColorField(Color) {
  if (Color === void 0 || Color === "default")
    return {};
  return { color: ColorValueToApiColor(Color) };
}
function ColorAttribute(Color) {
  if (Color === void 0 || Color === "default")
    return {};
  return { Color: ApiColorToColorValue(Color) };
}
function HasAnyAnnotation(Annotations) {
  return Object.keys(Annotations).length > 0;
}
function ChunkText(Text, Limit) {
  const Chunks = [];
  let Start = 0;
  while (Start < Text.length) {
    let End = Math.min(Start + Limit, Text.length);
    const Last = Text.charCodeAt(End - 1);
    if (End < Text.length && Last >= 55296 && Last <= 56319 && End - Start > 1)
      End -= 1;
    Chunks.push(Text.slice(Start, End));
    Start = End;
  }
  return Chunks;
}
function PushTextRun(Text, Annotations, Out, LinkUrl) {
  if (Text.length === 0)
    return;
  const AnnotationField = HasAnyAnnotation(Annotations) ? { annotations: Annotations } : {};
  for (const Chunk of ChunkText(Text, MaxRichTextLength)) {
    Out.push({
      type: "text",
      text: { content: Chunk, link: LinkUrl !== void 0 ? { url: LinkUrl } : null },
      ...AnnotationField
    });
  }
}
function NormalizeLinkUrl(Url) {
  const Trimmed = Url.trim();
  if (Trimmed.length === 0 || /\s/.test(Trimmed))
    return void 0;
  const Candidate = /^[a-z][a-z0-9+.-]*:/i.test(Trimmed) ? Trimmed : /^[^/?#]+\.[^/?#]+/.test(Trimmed) ? `https://${Trimmed}` : void 0;
  if (Candidate === void 0 || Candidate.length > MaxUrlLength)
    return void 0;
  if (!/^(https?:\/\/[^/?#\s]+|mailto:[^\s]+|tel:[^\s]+)/i.test(Candidate))
    return void 0;
  return Candidate;
}
var UuidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
function IsSendableMention(Node) {
  return Node.MentionKind === "date" ? /^\d{4}-\d{2}-\d{2}/.test(Node.Start) : UuidPattern.test(Node.Url);
}
function MentionNodeToNotionMention(Node) {
  switch (Node.MentionKind) {
    case "user":
      return { type: "user", user: { id: Node.Url } };
    case "page":
      return { type: "page", page: { id: Node.Url } };
    case "database":
      return { type: "database", database: { id: Node.Url } };
    case "date":
      return { type: "date", date: { start: Node.Start, end: Node.End } };
  }
}
function CollectRichText(Nodes, Annotations, Out) {
  for (const Node of Nodes) {
    switch (Node.Type) {
      case "Text":
        PushTextRun(Node.Text, Annotations, Out);
        break;
      case "Bold":
        CollectRichText(Node.Children, { ...Annotations, bold: true }, Out);
        break;
      case "Italic":
        CollectRichText(Node.Children, { ...Annotations, italic: true }, Out);
        break;
      case "Strikethrough":
        CollectRichText(Node.Children, { ...Annotations, strikethrough: true }, Out);
        break;
      case "Underline":
        CollectRichText(Node.Children, { ...Annotations, underline: true }, Out);
        break;
      case "Color":
        CollectRichText(Node.Children, { ...Annotations, color: ColorValueToApiColor(Node.Color) }, Out);
        break;
      case "Code":
        PushTextRun(Node.Text, { ...Annotations, code: true }, Out);
        break;
      case "Link": {
        const Inner = [];
        CollectRichText(Node.Children, Annotations, Inner);
        const Url = NormalizeLinkUrl(Node.Url);
        for (const Item of Inner) {
          Out.push(Item.type === "text" && Url !== void 0 ? { ...Item, text: { ...Item.text, link: { url: Url } } } : Item);
        }
        break;
      }
      case "Equation":
        if (Node.Expression.length > MaxEquationLength) {
          PushTextRun(`$${Node.Expression}$`, Annotations, Out);
          break;
        }
        Out.push({
          type: "equation",
          equation: { expression: Node.Expression },
          ...HasAnyAnnotation(Annotations) ? { annotations: Annotations } : {}
        });
        break;
      case "LineBreak":
        PushTextRun("\n", Annotations, Out);
        break;
      case "Mention":
        if (IsSendableMention(Node))
          Out.push({ type: "mention", mention: MentionNodeToNotionMention(Node) });
        else
          PushTextRun(MentionDisplayText(Node), Annotations, Out);
        break;
    }
  }
}
function MentionDisplayText(Node) {
  return Node.MentionKind === "date" ? Node.Start : Node.DisplayText;
}
function InlineNodesToRichText(Nodes) {
  const Out = [];
  CollectRichText(Nodes, {}, Out);
  return Out;
}
function MentionItemToInlineNode(Item) {
  const DisplayText = Item.plain_text ?? "";
  switch (Item.mention.type) {
    case "user":
      return { Type: "Mention", MentionKind: "user", Url: Item.mention.user.id, DisplayText };
    case "page":
      return { Type: "Mention", MentionKind: "page", Url: Item.mention.page.id, DisplayText };
    case "database":
      return { Type: "Mention", MentionKind: "database", Url: Item.mention.database.id, DisplayText };
    case "date":
      return { Type: "Mention", MentionKind: "date", Start: Item.mention.date.start, End: Item.mention.date.end };
  }
}
function RichTextItemToInlineNode(Item) {
  if (Item.type === "mention")
    return MentionItemToInlineNode(Item);
  let Leaf = Item.type === "equation" ? { Type: "Equation", Expression: Item.equation.expression } : Item.annotations?.code ? { Type: "Code", Text: Item.text.content } : { Type: "Text", Text: Item.text.content };
  if (Item.type === "text" && Item.text.link) {
    Leaf = { Type: "Link", Url: Item.text.link.url, Children: [Leaf] };
  }
  const Annotations = Item.annotations;
  if (Annotations?.bold)
    Leaf = { Type: "Bold", Children: [Leaf] };
  if (Annotations?.italic)
    Leaf = { Type: "Italic", Children: [Leaf] };
  if (Annotations?.strikethrough)
    Leaf = { Type: "Strikethrough", Children: [Leaf] };
  if (Annotations?.underline)
    Leaf = { Type: "Underline", Children: [Leaf] };
  if (Annotations?.color && Annotations.color !== "default") {
    Leaf = { Type: "Color", Color: ApiColorToColorValue(Annotations.color), Children: [Leaf] };
  }
  return Leaf;
}
function MergeAdjacentText(Nodes) {
  const Result = [];
  for (const Node of Nodes) {
    const Last = Result[Result.length - 1];
    if (Last && Last.Type === "Text" && Node.Type === "Text") {
      Result[Result.length - 1] = { Type: "Text", Text: Last.Text + Node.Text };
    } else {
      Result.push(Node);
    }
  }
  return Result;
}
function RichTextToInlineNodes(Items) {
  return MergeAdjacentText(Items.map(RichTextItemToInlineNode));
}
function PlainTextFromRichText(Items) {
  return Items.map((Item) => Item.type === "text" ? Item.text.content : Item.type === "equation" ? Item.equation.expression : Item.plain_text ?? "").join("");
}
var NotionLanguages = /* @__PURE__ */ new Set([
  "abap",
  "abc",
  "agda",
  "arduino",
  "ascii art",
  "assembly",
  "bash",
  "basic",
  "bnf",
  "c",
  "c#",
  "c++",
  "clojure",
  "coffeescript",
  "coq",
  "css",
  "dart",
  "dhall",
  "diff",
  "docker",
  "ebnf",
  "elixir",
  "elm",
  "erlang",
  "f#",
  "flow",
  "fortran",
  "gherkin",
  "glsl",
  "go",
  "graphql",
  "groovy",
  "haskell",
  "hcl",
  "html",
  "idris",
  "java",
  "javascript",
  "json",
  "julia",
  "kotlin",
  "latex",
  "less",
  "lisp",
  "livescript",
  "llvm ir",
  "lua",
  "makefile",
  "markdown",
  "markup",
  "matlab",
  "mathematica",
  "mermaid",
  "nix",
  "notion formula",
  "objective-c",
  "ocaml",
  "pascal",
  "perl",
  "php",
  "plain text",
  "powershell",
  "prolog",
  "protobuf",
  "purescript",
  "python",
  "r",
  "racket",
  "reason",
  "ruby",
  "rust",
  "sass",
  "scala",
  "scheme",
  "scss",
  "shell",
  "smalltalk",
  "solidity",
  "sql",
  "swift",
  "toml",
  "typescript",
  "vb.net",
  "verilog",
  "vhdl",
  "visual basic",
  "webassembly",
  "xml",
  "yaml",
  "java/c/c++/c#"
]);
var LanguageAliases = {
  "": "plain text",
  text: "plain text",
  txt: "plain text",
  plaintext: "plain text",
  plain: "plain text",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  kt: "kotlin",
  cs: "c#",
  csharp: "c#",
  cpp: "c++",
  "objc": "objective-c",
  sh: "shell",
  zsh: "shell",
  ps1: "powershell",
  yml: "yaml",
  md: "markdown",
  tex: "latex",
  golang: "go",
  dockerfile: "docker",
  make: "makefile",
  proto: "protobuf",
  wasm: "webassembly",
  vb: "visual basic",
  fs: "f#",
  fsharp: "f#"
};
function NormalizeCodeLanguage(Language) {
  const Key = (Language ?? "").trim().toLowerCase();
  const Resolved = LanguageAliases[Key] ?? Key;
  return NotionLanguages.has(Resolved) ? Resolved : "plain text";
}
function EmojiIcon(Icon) {
  if (Icon === null || Icon.length === 0 || Icon.length > 16 || !/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(Icon))
    return {};
  return { icon: { type: "emoji", emoji: Icon } };
}
function ItemLength(Item) {
  return Item.type === "text" ? Item.text.content.length : Item.type === "equation" ? Item.equation.expression.length : 0;
}
function GroupRichText(Items) {
  const Groups = [[]];
  let Length = 0;
  for (const Item of Items) {
    const Current = Groups[Groups.length - 1];
    const Size = ItemLength(Item);
    if (Current.length > 0 && (Current.length >= MaxRichTextItems || Length + Size > MaxBlockTextLength)) {
      Groups.push([Item]);
      Length = Size;
    } else {
      Current.push(Item);
      Length += Size;
    }
  }
  return Groups;
}
var Paragraphs = (Groups) => Groups.map((Group) => ({ type: "paragraph", paragraph: { rich_text: Group } }));
function BlockToNotionBlocks(Node, Children) {
  const Nest = (RichText) => {
    const [First, ...Overflow] = GroupRichText(RichText);
    return { First, Children: [...Paragraphs(Overflow), ...Children] };
  };
  const ChildrenField = (Blocks) => Blocks.length > 0 ? { children: Blocks } : {};
  switch (Node.Type) {
    case "Paragraph": {
      const Text = Nest(InlineNodesToRichText(Node.Content));
      return [{ type: "paragraph", paragraph: { rich_text: Text.First, ...ColorField(Node.Color), ...ChildrenField(Text.Children) } }];
    }
    case "Heading": {
      const [First, ...Overflow] = GroupRichText(InlineNodesToRichText(Node.Content));
      const Content = { rich_text: First, ...ColorField(Node.Color), ...Children.length > 0 ? { is_toggleable: true, children: Children } : {} };
      const Heading = Node.Level === 1 ? { type: "heading_1", heading_1: Content } : Node.Level === 2 ? { type: "heading_2", heading_2: Content } : Node.Level === 3 ? { type: "heading_3", heading_3: Content } : { type: "heading_4", heading_4: Content };
      return [Heading, ...Paragraphs(Overflow)];
    }
    case "BulletedListItem": {
      const Text = Nest(InlineNodesToRichText(Node.Content));
      return [{ type: "bulleted_list_item", bulleted_list_item: { rich_text: Text.First, ...ColorField(Node.Color), ...ChildrenField(Text.Children) } }];
    }
    case "NumberedListItem": {
      const Text = Nest(InlineNodesToRichText(Node.Content));
      return [{ type: "numbered_list_item", numbered_list_item: { rich_text: Text.First, ...ColorField(Node.Color), ...ChildrenField(Text.Children) } }];
    }
    case "ToDo": {
      const Text = Nest(InlineNodesToRichText(Node.Content));
      return [{ type: "to_do", to_do: { rich_text: Text.First, checked: Node.Checked, ...ColorField(Node.Color), ...ChildrenField(Text.Children) } }];
    }
    case "Quote": {
      const Text = Nest(InlineNodesToRichText(Node.Content));
      return [{ type: "quote", quote: { rich_text: Text.First, ...ColorField(Node.Color), ...ChildrenField(Text.Children) } }];
    }
    case "Toggle": {
      const Text = Nest(InlineNodesToRichText(Node.Content));
      return [{ type: "toggle", toggle: { rich_text: Text.First, ...ColorField(Node.Color), ...ChildrenField(Text.Children) } }];
    }
    case "Code": {
      const Items = [];
      PushTextRun(Node.Text, {}, Items);
      const Language = NormalizeCodeLanguage(Node.Language);
      const Blocks = GroupRichText(Items).map((Group) => ({ type: "code", code: { rich_text: Group, language: Language } }));
      return [...Blocks, ...Children];
    }
    case "Divider":
      return [{ type: "divider", divider: {} }, ...Children];
    case "Callout": {
      const [Lead, ...Rest] = Children;
      const LeadContent = Lead?.type === "paragraph" && Lead.paragraph.color === void 0 && Lead.paragraph.children === void 0 ? Lead.paragraph.rich_text : void 0;
      return [{
        type: "callout",
        callout: {
          rich_text: LeadContent ?? [],
          ...EmojiIcon(Node.Icon),
          ...ColorField(Node.Color),
          ...ChildrenField(LeadContent !== void 0 ? Rest : Children)
        }
      }];
    }
    case "Equation":
      return Node.Expression.length > MaxEquationLength ? [...BlockToNotionBlocks({ Type: "Code", Depth: Node.Depth, Language: "latex", Text: Node.Expression }, []), ...Children] : [{ type: "equation", equation: { expression: Node.Expression } }, ...Children];
  }
}
function BuildNotionBlockTree(Blocks, Cursor, ParentDepth) {
  const Result = [];
  while (Cursor.Index < Blocks.length) {
    const Current = Blocks[Cursor.Index];
    if (Current.Depth <= ParentDepth)
      break;
    const ChildDepth = Current.Depth;
    Cursor.Index += 1;
    const Children = BuildNotionBlockTree(Blocks, Cursor, ChildDepth);
    Result.push(...BlockToNotionBlocks(Current, Children));
  }
  return Result;
}
function DocumentToNotionBlocks(Doc) {
  return BuildNotionBlockTree(Doc.Blocks, { Index: 0 }, -1);
}
function NotionBlockToBlock(Node, Depth) {
  switch (Node.type) {
    case "paragraph":
      return { Type: "Paragraph", Depth, ...ColorAttribute(Node.paragraph.color), Content: RichTextToInlineNodes(Node.paragraph.rich_text) };
    case "heading_1":
      return { Type: "Heading", Depth, Level: 1, ...ColorAttribute(Node.heading_1.color), Content: RichTextToInlineNodes(Node.heading_1.rich_text) };
    case "heading_2":
      return { Type: "Heading", Depth, Level: 2, ...ColorAttribute(Node.heading_2.color), Content: RichTextToInlineNodes(Node.heading_2.rich_text) };
    case "heading_3":
      return { Type: "Heading", Depth, Level: 3, ...ColorAttribute(Node.heading_3.color), Content: RichTextToInlineNodes(Node.heading_3.rich_text) };
    case "heading_4":
      return { Type: "Heading", Depth, Level: 4, ...ColorAttribute(Node.heading_4.color), Content: RichTextToInlineNodes(Node.heading_4.rich_text) };
    case "bulleted_list_item":
      return { Type: "BulletedListItem", Depth, ...ColorAttribute(Node.bulleted_list_item.color), Content: RichTextToInlineNodes(Node.bulleted_list_item.rich_text) };
    case "numbered_list_item":
      return { Type: "NumberedListItem", Depth, ...ColorAttribute(Node.numbered_list_item.color), Content: RichTextToInlineNodes(Node.numbered_list_item.rich_text) };
    case "to_do":
      return { Type: "ToDo", Depth, Checked: Node.to_do.checked ?? false, ...ColorAttribute(Node.to_do.color), Content: RichTextToInlineNodes(Node.to_do.rich_text) };
    case "quote":
      return { Type: "Quote", Depth, ...ColorAttribute(Node.quote.color), Content: RichTextToInlineNodes(Node.quote.rich_text) };
    case "code":
      return { Type: "Code", Depth, Language: Node.code.language, Text: PlainTextFromRichText(Node.code.rich_text) };
    case "divider":
      return { Type: "Divider", Depth };
    case "callout":
      return { Type: "Callout", Depth, Icon: Node.callout.icon?.type === "emoji" ? Node.callout.icon.emoji : null, ...ColorAttribute(Node.callout.color) };
    case "toggle":
      return { Type: "Toggle", Depth, ...ColorAttribute(Node.toggle.color), Content: RichTextToInlineNodes(Node.toggle.rich_text) };
    case "equation":
      return { Type: "Equation", Depth, Expression: Node.equation.expression };
  }
}
function FlattenNotionBlocks(Blocks, Depth, Out) {
  for (const Node of Blocks) {
    if (Node.type === "callout") {
      Out.push({ Type: "Callout", Depth, Icon: Node.callout.icon?.type === "emoji" ? Node.callout.icon.emoji : null, ...ColorAttribute(Node.callout.color) });
      if (Node.callout.rich_text.length > 0) {
        Out.push({ Type: "Paragraph", Depth: Depth + 1, Content: RichTextToInlineNodes(Node.callout.rich_text) });
      }
      FlattenNotionBlocks(GetNotionBlockChildren(Node), Depth + 1, Out);
      continue;
    }
    Out.push(NotionBlockToBlock(Node, Depth));
    FlattenNotionBlocks(GetNotionBlockChildren(Node), Depth + 1, Out);
  }
}
function NotionBlocksToDocument(Blocks) {
  const Result = [];
  FlattenNotionBlocks(Blocks, 0, Result);
  return { Blocks: Result };
}
function ChunkChildren(Blocks) {
  if (Blocks.length === 0)
    return [[]];
  const Chunks = [];
  for (let Start = 0; Start < Blocks.length; Start += MaxBlockChildren) {
    Chunks.push(Blocks.slice(Start, Start + MaxBlockChildren));
  }
  return Chunks;
}

// Package/ReactNativeNotionMarkdown/Distribution/NotionRequest.js
var MaxRequestBlocks = 1e3;
var MaxNestingLevels = 2;
var MaxRequestBytes = 3e5;
function MarkdownToNotionBlocks(Markdown) {
  return DocumentToNotionBlocks(Parse(Markdown));
}
function PlainTextToNotionBlocks(Text) {
  const Lines = Text.replace(/\r\n?/g, "\n").split("\n");
  while (Lines.length > 0 && Lines[Lines.length - 1].trim() === "")
    Lines.pop();
  const Blocks = [];
  for (const Line of Lines) {
    const Items = ChunkText(Line, MaxRichTextLength).map((Content) => ({ type: "text", text: { content: Content, link: null } }));
    const PerBlock = Math.min(MaxRichTextItems, Math.floor(MaxBlockTextLength / MaxRichTextLength));
    for (let Start = 0; Start < Math.max(Items.length, 1); Start += PerBlock) {
      Blocks.push({ type: "paragraph", paragraph: { rich_text: Items.slice(Start, Start + PerBlock) } });
    }
  }
  return Blocks;
}
function Utf8Length(Text) {
  let Bytes = 0;
  for (let Index = 0; Index < Text.length; Index += 1) {
    const Code = Text.charCodeAt(Index);
    if (Code < 128)
      Bytes += 1;
    else if (Code < 2048)
      Bytes += 2;
    else if (Code >= 55296 && Code <= 56319) {
      Bytes += 4;
      Index += 1;
    } else
      Bytes += 3;
  }
  return Bytes;
}
function MeasureBlock(Node) {
  const Children = GetNotionBlockChildren(Node);
  let Count = 1;
  let Levels = 0;
  let Widest = Children.length;
  for (const Child of Children) {
    const Inner = MeasureBlock(Child);
    Count += Inner.Count;
    Levels = Math.max(Levels, Inner.Levels + 1);
    Widest = Math.max(Widest, Inner.Widest);
  }
  return { Count, Levels, Widest };
}
var BlockBytes = (Node) => Utf8Length(JSON.stringify(Node));
function ToPiece(Node) {
  const Children = GetNotionBlockChildren(Node);
  if (Children.length === 0)
    return { Block: Node, Deferred: [], Count: 1, Bytes: BlockBytes(Node) };
  const Size = MeasureBlock(Node);
  const Bytes = BlockBytes(Node);
  const Whole = Size.Levels <= MaxNestingLevels && Size.Widest <= MaxBlockChildren && Size.Count <= MaxRequestBlocks && Bytes <= MaxRequestBytes;
  if (Whole)
    return { Block: Node, Deferred: [], Count: Size.Count, Bytes };
  const Bare = WithNotionBlockChildren(Node, []);
  return { Block: Bare, Deferred: Children, Count: 1, Bytes: BlockBytes(Bare) };
}
function ToBatches(Blocks) {
  const Batches = [];
  let Current = [];
  let Count = 0;
  let Bytes = 0;
  for (const Node of Blocks) {
    const Next = ToPiece(Node);
    const Full = Current.length >= MaxBlockChildren || Count + Next.Count > MaxRequestBlocks || Bytes + Next.Bytes > MaxRequestBytes;
    if (Current.length > 0 && Full) {
      Batches.push(Current);
      Current = [];
      Count = 0;
      Bytes = 0;
    }
    Current.push(Next);
    Count += Next.Count;
    Bytes += Next.Bytes;
  }
  if (Current.length > 0)
    Batches.push(Current);
  return Batches;
}
function PlanPageChildren(Blocks) {
  const [First] = ToBatches(Blocks);
  if (First === void 0)
    return { Initial: [], Remaining: [] };
  const Incomplete = First.findIndex((Item) => Item.Deferred.length > 0);
  const Taken = Incomplete === -1 ? First.length : Incomplete;
  return { Initial: Blocks.slice(0, Taken), Remaining: Blocks.slice(Taken) };
}
async function AppendNotionBlocks(Append, ParentId, Blocks) {
  for (const Batch of ToBatches(Blocks)) {
    const Ids = await Append(ParentId, Batch.map((Item) => Item.Block));
    if (Ids.length !== Batch.length) {
      throw new Error(`Notion reported ${Ids.length} created blocks for a request that appended ${Batch.length}.`);
    }
    for (let Index = 0; Index < Batch.length; Index += 1) {
      const { Deferred } = Batch[Index];
      if (Deferred.length > 0)
        await AppendNotionBlocks(Append, Ids[Index], Deferred);
    }
  }
}
export {
  ApiColorToColorValue,
  AppendNotionBlocks,
  ChunkChildren,
  ChunkText,
  ColorValueToApiColor,
  DocumentToNotionBlocks,
  GetNotionBlockChildren,
  InlineNodesToRichText,
  IsColorValue,
  MarkdownToNotionBlocks,
  MaxBlockChildren,
  MaxBlockTextLength,
  MaxEquationLength,
  MaxNestingLevels,
  MaxRequestBlocks,
  MaxRequestBytes,
  MaxRichTextItems,
  MaxRichTextLength,
  MaxUrlLength,
  NormalizeCodeLanguage,
  NormalizeLinkUrl,
  NotionBlocksToDocument,
  NotionColors,
  Parse,
  ParseInline,
  PlainTextToNotionBlocks,
  PlanPageChildren,
  RichTextToInlineNodes,
  Serialize,
  SerializeInline,
  WithNotionBlockChildren
};
