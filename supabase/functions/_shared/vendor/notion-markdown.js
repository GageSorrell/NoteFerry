// Package/NotionMarkdown/Distribution/Model.js
var UnsupportedElementError = class extends Error {
  UnsupportedElements;
  constructor(UnsupportedElements) {
    super(`Unsupported rich-content elements: ${UnsupportedElements.map((Entry) => `${Entry.DisplayLabel} (${Entry.Count})`).join(", ")}`);
    this.name = "UnsupportedElementError";
    this.UnsupportedElements = UnsupportedElements;
  }
};
var UnsupportedCollector = class {
  #Counts = /* @__PURE__ */ new Map();
  Add(Identity, Count = 1) {
    const Key = `${Identity.Reason}:${Identity.BlockType}`;
    const Existing = this.#Counts.get(Key);
    this.#Counts.set(Key, {
      ...Identity,
      Count: (Existing?.Count ?? 0) + Count
    });
  }
  ToArray() {
    return [...this.#Counts.values()].sort((Left, Right) => Left.DisplayLabel.localeCompare(Right.DisplayLabel));
  }
};
var ThrowIfUnsupported = (UnsupportedElements, Options) => {
  if (Options.FailOnUnsupported === true && UnsupportedElements.length > 0) {
    throw new UnsupportedElementError(UnsupportedElements);
  }
};

// Package/NotionMarkdown/Distribution/Markdown.js
var ListIndentWidth = 3;
var UnsupportedTagLabels = {
  audio: "Audio",
  bookmark: "Bookmark",
  callout: "Callout",
  columns: "Columns",
  details: "Toggle",
  embed: "Embed",
  file: "File",
  image: "Image",
  pdf: "PDF",
  table: "Table",
  video: "Video"
};
var DepthFromIndent = (Indent) => Math.max(0, Math.floor(Indent.replace(/\t/gu, "   ").length / ListIndentWidth));
var IsDivider = (Line) => /^\s{0,3}(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/u.test(Line);
var MatchBlockStart = (Line) => /^\s{0,3}(?:#{1,3}\s+|>|```|~~~|[-*+]\s+|\d+[.)]\s+)/u.test(Line) || IsDivider(Line) || /^\s*<\/?[A-Za-z][^>]*>/u.test(Line) || /^\s*!\[[^\]]*\]\([^)]+\)\s*$/u.test(Line);
var UnsupportedTag = (Line) => /^\s*<([A-Za-z][\w-]*)\b[^>]*>/u.exec(Line)?.[1]?.toLowerCase();
var ConsumeUnsupportedTag = (Lines, Start, Tag) => {
  if (new RegExp(`</${Tag}\\s*>`, "iu").test(Lines[Start] ?? "")) {
    return Start + 1;
  }
  for (let Index = Start + 1; Index < Lines.length; Index += 1) {
    if (new RegExp(`</${Tag}\\s*>`, "iu").test(Lines[Index] ?? "")) {
      return Index + 1;
    }
  }
  return Start + 1;
};
var ParseMarkdownBlocks = (Markdown, Options = {}) => {
  const Lines = Markdown.replace(/\r\n?/gu, "\n").split("\n");
  const Blocks = [];
  const Unsupported = new UnsupportedCollector();
  let Index = 0;
  while (Index < Lines.length) {
    const Line = Lines[Index] ?? "";
    if (Line.trim() === "") {
      Index += 1;
      continue;
    }
    const Tag = UnsupportedTag(Line);
    if (Tag !== void 0 && Tag !== "u") {
      Unsupported.Add({
        BlockType: Tag,
        DisplayLabel: UnsupportedTagLabels[Tag] ?? Tag,
        Reason: UnsupportedTagLabels[Tag] === void 0 ? "Unknown" : "NoteFerry"
      });
      Index = ConsumeUnsupportedTag(Lines, Index, Tag);
      continue;
    }
    if (/^\s*!\[[^\]]*\]\([^)]+\)\s*$/u.test(Line)) {
      Unsupported.Add({ BlockType: "image", DisplayLabel: "Image", Reason: "NoteFerry" });
      Index += 1;
      continue;
    }
    if (Index + 1 < Lines.length && /\|/u.test(Line) && /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/u.test(Lines[Index + 1] ?? "")) {
      Unsupported.Add({ BlockType: "table", DisplayLabel: "Table", Reason: "NoteFerry" });
      Index += 2;
      while (Index < Lines.length && /\|/u.test(Lines[Index] ?? "")) {
        Index += 1;
      }
      continue;
    }
    const Fence = /^\s{0,3}(```|~~~)\s*([^\s`]*)\s*$/u.exec(Line);
    if (Fence) {
      const Marker = Fence[1] ?? "```";
      const Content = [];
      Index += 1;
      while (Index < Lines.length && !(Lines[Index] ?? "").trimStart().startsWith(Marker)) {
        Content.push(Lines[Index] ?? "");
        Index += 1;
      }
      if (Index < Lines.length) {
        Index += 1;
      }
      Blocks.push({
        Depth: 0,
        Language: Fence[2] || "plain text",
        Markdown: Content.join("\n"),
        Type: "Code"
      });
      continue;
    }
    if (IsDivider(Line)) {
      Blocks.push({ Depth: 0, Markdown: "", Type: "Divider" });
      Index += 1;
      continue;
    }
    const Heading = /^\s{0,3}(#{1,3})\s+(.*)$/u.exec(Line);
    if (Heading) {
      const Type = `Heading${Heading[1]?.length ?? 1}`;
      Blocks.push({ Depth: 0, Markdown: Heading[2] ?? "", Type });
      Index += 1;
      continue;
    }
    const ToDo = /^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/u.exec(Line);
    if (ToDo) {
      Blocks.push({
        Checked: (ToDo[2] ?? " ").toLowerCase() === "x",
        Depth: DepthFromIndent(ToDo[1] ?? ""),
        Markdown: ToDo[3] ?? "",
        Type: "ToDo"
      });
      Index += 1;
      continue;
    }
    const Bullet = /^(\s*)[-*+]\s+(.*)$/u.exec(Line);
    if (Bullet) {
      Blocks.push({
        Depth: DepthFromIndent(Bullet[1] ?? ""),
        Markdown: Bullet[2] ?? "",
        Type: "BulletedListItem"
      });
      Index += 1;
      continue;
    }
    const Numbered = /^(\s*)\d+[.)]\s+(.*)$/u.exec(Line);
    if (Numbered) {
      Blocks.push({
        Depth: DepthFromIndent(Numbered[1] ?? ""),
        Markdown: Numbered[2] ?? "",
        Type: "NumberedListItem"
      });
      Index += 1;
      continue;
    }
    const Quote = /^\s{0,3}>\s?(.*)$/u.exec(Line);
    if (Quote) {
      const Content = [Quote[1] ?? ""];
      Index += 1;
      while (Index < Lines.length) {
        const Continuation = /^\s{0,3}>\s?(.*)$/u.exec(Lines[Index] ?? "");
        if (!Continuation) {
          break;
        }
        Content.push(Continuation[1] ?? "");
        Index += 1;
      }
      Blocks.push({ Depth: 0, Markdown: Content.join("\n"), Type: "Quote" });
      continue;
    }
    const Paragraph = [Line];
    Index += 1;
    while (Index < Lines.length && (Lines[Index] ?? "").trim() !== "" && !MatchBlockStart(Lines[Index] ?? "")) {
      Paragraph.push(Lines[Index] ?? "");
      Index += 1;
    }
    Blocks.push({ Depth: 0, Markdown: Paragraph.join("\n"), Type: "Paragraph" });
  }
  const UnsupportedElements = Unsupported.ToArray();
  ThrowIfUnsupported(UnsupportedElements, Options);
  return { Blocks, UnsupportedElements };
};
var PrefixFor = (Block, Number) => {
  const Indent = " ".repeat(Block.Depth * ListIndentWidth);
  switch (Block.Type) {
    case "Heading1":
      return "# ";
    case "Heading2":
      return "## ";
    case "Heading3":
      return "### ";
    case "BulletedListItem":
      return `${Indent}- `;
    case "NumberedListItem":
      return `${Indent}${Number}. `;
    case "ToDo":
      return `${Indent}- [${Block.Checked === true ? "x" : " "}] `;
    case "Quote":
      return "> ";
    default:
      return "";
  }
};
var SerializeMarkdownBlocks = (Blocks) => {
  const Output = [];
  const NumberAtDepth = /* @__PURE__ */ new Map();
  for (const Block of Blocks) {
    const IsList = Block.Type === "BulletedListItem" || Block.Type === "NumberedListItem" || Block.Type === "ToDo";
    if (Block.Type === "Divider") {
      Output.push({ IsList: false, Text: "---" });
      continue;
    }
    if (Block.Type === "Code") {
      Output.push({
        IsList: false,
        Text: `\`\`\`${Block.Language === "plain text" ? "" : Block.Language ?? ""}
${Block.Markdown}
\`\`\``
      });
      continue;
    }
    let Number = 1;
    if (Block.Type === "NumberedListItem") {
      Number = (NumberAtDepth.get(Block.Depth) ?? 0) + 1;
      NumberAtDepth.set(Block.Depth, Number);
    } else {
      NumberAtDepth.delete(Block.Depth);
      if (!IsList) {
        NumberAtDepth.clear();
      }
    }
    const Prefix = PrefixFor(Block, Number);
    const Lines = Block.Markdown.split("\n");
    if (Block.Type === "Quote") {
      Output.push({ IsList: false, Text: Lines.map((Line) => `> ${Line}`).join("\n") });
    } else {
      Output.push({ IsList, Text: `${Prefix}${Block.Markdown}` });
    }
  }
  return Output.map((Entry, Index) => {
    if (Index === 0) {
      return Entry.Text;
    }
    const Previous = Output[Index - 1];
    return `${Previous?.IsList === true && Entry.IsList ? "\n" : "\n\n"}${Entry.Text}`;
  }).join("").trimEnd();
};

// Package/NotionMarkdown/Distribution/Notion.js
var MaxRichTextContentLength = 2e3;
var MaxNotionBlockChildren = 100;
var ChunkNotionBlocks = (Blocks) => {
  const Chunks = [];
  for (let Index = 0; Index < Blocks.length; Index += MaxNotionBlockChildren) {
    Chunks.push(Blocks.slice(Index, Index + MaxNotionBlockChildren));
  }
  return Chunks;
};
var DefaultAnnotations = {
  bold: false,
  code: false,
  color: "default",
  italic: false,
  strikethrough: false,
  underline: false
};
var Escaped = (Source, Index) => {
  let Slashes = 0;
  for (let Cursor = Index - 1; Cursor >= 0 && Source[Cursor] === "\\"; Cursor -= 1) {
    Slashes += 1;
  }
  return Slashes % 2 === 1;
};
var FindClosing = (Source, Marker, Start) => {
  let Cursor = Start;
  while (Cursor < Source.length) {
    const Found = Source.indexOf(Marker, Cursor);
    if (Found < 0) {
      return -1;
    }
    if (!Escaped(Source, Found)) {
      if ((Marker === "**" || Marker === "__") && Source.startsWith(Marker[0] ?? "", Found + 2)) {
        return Found + 1;
      }
      return Found;
    }
    Cursor = Found + Marker.length;
  }
  return -1;
};
var SplitContent = (Content) => {
  const Characters = Array.from(Content);
  const Chunks = [];
  for (let Index = 0; Index < Characters.length; Index += MaxRichTextContentLength) {
    Chunks.push(Characters.slice(Index, Index + MaxRichTextContentLength).join(""));
  }
  return Chunks;
};
var SameAnnotations = (Left, Right) => Left.bold === Right.bold && Left.code === Right.code && Left.color === Right.color && Left.italic === Right.italic && Left.strikethrough === Right.strikethrough && Left.underline === Right.underline;
var PushDraft = (Drafts, Content, Annotations, Url) => {
  if (Content === "") {
    return;
  }
  const Previous = Drafts.at(-1);
  if (Previous && Previous.Url === Url && SameAnnotations(Previous.Annotations, Annotations)) {
    Drafts[Drafts.length - 1] = {
      Annotations,
      Content: Previous.Content + Content,
      ...Url === void 0 ? {} : { Url }
    };
    return;
  }
  Drafts.push({ Annotations, Content, ...Url === void 0 ? {} : { Url } });
};
var ParseInlineRange = (Source, Drafts, Annotations, Url) => {
  let Plain = "";
  const Flush = () => {
    PushDraft(Drafts, Plain, Annotations, Url);
    Plain = "";
  };
  for (let Index = 0; Index < Source.length; ) {
    if (Source[Index] === "\\" && Index + 1 < Source.length) {
      Plain += Source[Index + 1];
      Index += 2;
      continue;
    }
    if (Source.startsWith("<u>", Index)) {
      const End = Source.indexOf("</u>", Index + 3);
      if (End >= 0) {
        Flush();
        ParseInlineRange(Source.slice(Index + 3, End), Drafts, {
          ...Annotations,
          underline: true
        }, Url);
        Index = End + 4;
        continue;
      }
    }
    if (Source[Index] === "[") {
      const LabelEnd = FindClosing(Source, "]", Index + 1);
      if (LabelEnd >= 0 && Source[LabelEnd + 1] === "(") {
        const UrlEnd = FindClosing(Source, ")", LabelEnd + 2);
        if (UrlEnd >= 0) {
          Flush();
          ParseInlineRange(Source.slice(Index + 1, LabelEnd), Drafts, Annotations, Source.slice(LabelEnd + 2, UrlEnd));
          Index = UrlEnd + 1;
          continue;
        }
      }
    }
    if (Source.startsWith("***", Index)) {
      const End = FindClosing(Source, "***", Index + 3);
      if (End >= 0) {
        Flush();
        ParseInlineRange(Source.slice(Index + 3, End), Drafts, {
          ...Annotations,
          bold: true,
          italic: true
        }, Url);
        Index = End + 3;
        continue;
      }
    }
    const Markers = [
      ["**", "bold"],
      ["__", "bold"],
      ["~~", "strikethrough"],
      ["`", "code"],
      ["*", "italic"],
      ["_", "italic"]
    ];
    const Match = Markers.find(([Marker]) => Source.startsWith(Marker, Index));
    if (Match) {
      const [Marker, Annotation] = Match;
      const End = FindClosing(Source, Marker, Index + Marker.length);
      if (End >= 0) {
        Flush();
        ParseInlineRange(Source.slice(Index + Marker.length, End), Drafts, {
          ...Annotations,
          [Annotation]: true
        }, Url);
        Index = End + Marker.length;
        continue;
      }
    }
    Plain += Source[Index];
    Index += 1;
  }
  Flush();
};
var MarkdownToNotionRichText = (Markdown) => {
  const Drafts = [];
  ParseInlineRange(Markdown, Drafts, DefaultAnnotations);
  return Drafts.flatMap((Draft) => SplitContent(Draft.Content).map((Content) => ({
    annotations: Draft.Annotations,
    text: {
      content: Content,
      ...Draft.Url === void 0 ? {} : { link: { url: Draft.Url } }
    },
    type: "text"
  })));
};
var EscapeInlineText = (Text) => Text.replace(/([\\`*_[\]~])/gu, "\\$1");
var WrapAnnotations = (Text, Annotations) => {
  let Result = EscapeInlineText(Text);
  if (Annotations.code === true) {
    Result = `\`${Text.replace(/`/gu, "\\`")}\``;
  }
  if (Annotations.underline === true) {
    Result = `<u>${Result}</u>`;
  }
  if (Annotations.strikethrough === true) {
    Result = `~~${Result}~~`;
  }
  if (Annotations.italic === true) {
    Result = `*${Result}*`;
  }
  if (Annotations.bold === true) {
    Result = `**${Result}**`;
  }
  return Result;
};
var RichTextToMarkdown = (Items, Unsupported) => Items.map((Item) => {
  if (!Item || typeof Item !== "object") {
    Unsupported.Add({ BlockType: "rich_text", DisplayLabel: "Rich text", Reason: "Unknown" });
    return "";
  }
  const Value = Item;
  const Type = typeof Value.type === "string" ? Value.type : "text" in Value ? "text" : "unknown";
  if (Type !== "text") {
    Unsupported.Add({
      BlockType: `rich_text_${Type}`,
      DisplayLabel: Type === "mention" ? "Mention" : Type === "equation" ? "Inline equation" : "Rich text",
      Reason: "NoteFerry"
    });
    return typeof Value.plain_text === "string" ? EscapeInlineText(Value.plain_text) : "";
  }
  const Text = Value.text;
  const Content = typeof Text?.content === "string" ? Text.content : typeof Value.plain_text === "string" ? Value.plain_text : "";
  const Annotations = Value.annotations ?? {};
  if (Annotations.color !== void 0 && Annotations.color !== "default") {
    Unsupported.Add({ BlockType: "text_color", DisplayLabel: "Text color", Reason: "NoteFerry" });
  }
  let Markdown = WrapAnnotations(Content, Annotations);
  const Url = typeof Text?.link?.url === "string" ? Text.link.url : void 0;
  if (Url) {
    Markdown = `[${Markdown}](${Url})`;
  }
  return Markdown;
}).join("");
var BlockFromMarkdown = (Block) => {
  const RichText = MarkdownToNotionRichText(Block.Markdown);
  switch (Block.Type) {
    case "Heading1":
      return { object: "block", type: "heading_1", heading_1: { rich_text: [...RichText] } };
    case "Heading2":
      return { object: "block", type: "heading_2", heading_2: { rich_text: [...RichText] } };
    case "Heading3":
      return { object: "block", type: "heading_3", heading_3: { rich_text: [...RichText] } };
    case "BulletedListItem":
      return { object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: [...RichText] } };
    case "NumberedListItem":
      return { object: "block", type: "numbered_list_item", numbered_list_item: { rich_text: [...RichText] } };
    case "ToDo":
      return { object: "block", type: "to_do", to_do: { checked: Block.Checked === true, rich_text: [...RichText] } };
    case "Quote":
      return { object: "block", type: "quote", quote: { rich_text: [...RichText] } };
    case "Code":
      return {
        code: {
          language: Block.Language || "plain text",
          rich_text: [...MarkdownToNotionRichText(Block.Markdown.replace(/([\\`*_[\]~])/gu, "\\$1"))]
        },
        object: "block",
        type: "code"
      };
    case "Divider":
      return { divider: {}, object: "block", type: "divider" };
    case "Paragraph":
    default:
      return { object: "block", paragraph: { rich_text: [...RichText] }, type: "paragraph" };
  }
};
var IsListBlock = (Block) => Block.Type === "BulletedListItem" || Block.Type === "NumberedListItem" || Block.Type === "ToDo";
var MaterializeNode = (Node) => {
  if (Node.Children.length === 0) {
    return Node.Block;
  }
  const Value = Node.Block;
  const Type = Value.type;
  if (typeof Type !== "string") {
    return Node.Block;
  }
  const Payload = Value[Type];
  return {
    ...Value,
    [Type]: { ...Payload, children: Node.Children.map(MaterializeNode) }
  };
};
var BlocksToNotion = (Parsed) => {
  const Roots = [];
  const LastListAtDepth = [];
  for (const MarkdownBlock of Parsed.Blocks) {
    const Node = { Block: BlockFromMarkdown(MarkdownBlock), Children: [] };
    if (!IsListBlock(MarkdownBlock) || MarkdownBlock.Depth === 0) {
      Roots.push(Node);
      LastListAtDepth.length = 0;
      if (IsListBlock(MarkdownBlock)) {
        LastListAtDepth[0] = Node;
      }
      continue;
    }
    const Depth = Math.min(MarkdownBlock.Depth, LastListAtDepth.length);
    const Parent = LastListAtDepth[Math.max(0, Depth - 1)];
    if (!Parent) {
      Roots.push(Node);
      LastListAtDepth[0] = Node;
      LastListAtDepth.length = 1;
      continue;
    }
    Parent.Children.push(Node);
    LastListAtDepth[Depth] = Node;
    LastListAtDepth.length = Depth + 1;
  }
  return Roots.map(MaterializeNode);
};
var MarkdownToNotionBlocks = (Markdown, Options = {}) => {
  const Parsed = ParseMarkdownBlocks(Markdown, Options);
  return { Blocks: BlocksToNotion(Parsed), UnsupportedElements: Parsed.UnsupportedElements };
};
var BlockTypeLabels = {
  audio: "Audio",
  bookmark: "Bookmark",
  breadcrumb: "Breadcrumb",
  callout: "Callout",
  child_database: "Child database",
  child_page: "Child page",
  column: "Column",
  column_list: "Columns",
  embed: "Embed",
  equation: "Equation",
  file: "File",
  image: "Image",
  link_preview: "Link preview",
  link_to_page: "Page link",
  meeting_notes: "Meeting notes",
  pdf: "PDF",
  synced_block: "Synced block",
  table: "Table",
  table_of_contents: "Table of contents",
  table_row: "Table row",
  tab: "Tab",
  template: "Template",
  toggle: "Toggle",
  transcription: "Transcription",
  unsupported: "Unsupported block",
  video: "Video"
};
var NotionApiOnly = /* @__PURE__ */ new Set([
  "child_database",
  "child_page",
  "link_preview",
  "meeting_notes",
  "transcription",
  "unsupported"
]);
var ReadBlockType = (Block) => {
  if (typeof Block.type === "string") {
    return Block.type;
  }
  return Object.keys(Block).find((Key) => Key !== "object" && Key !== "children") ?? "unknown";
};
var RichTextFromPayload = (Payload) => {
  if (!Payload || typeof Payload !== "object") {
    return [];
  }
  const RichText = Payload.rich_text;
  return Array.isArray(RichText) ? RichText : [];
};
var ReadChildren = (Block, Payload) => {
  if (Array.isArray(Block.children)) {
    return Block.children;
  }
  if (Payload && typeof Payload === "object" && Array.isArray(Payload.children)) {
    return Payload.children;
  }
  return [];
};
var AppendNotionBlock = (BlockValue, Depth, Output, Unsupported) => {
  if (!BlockValue || typeof BlockValue !== "object") {
    Unsupported.Add({ BlockType: "unknown", DisplayLabel: "Unknown block", Reason: "Unknown" });
    return;
  }
  const Block = BlockValue;
  const Type = ReadBlockType(Block);
  const Payload = Block[Type];
  const Markdown = RichTextToMarkdown(RichTextFromPayload(Payload), Unsupported);
  let Result;
  switch (Type) {
    case "paragraph":
      Result = { Depth: 0, Markdown, Type: "Paragraph" };
      break;
    case "heading_1":
      Result = { Depth: 0, Markdown, Type: "Heading1" };
      break;
    case "heading_2":
      Result = { Depth: 0, Markdown, Type: "Heading2" };
      break;
    case "heading_3":
      Result = { Depth: 0, Markdown, Type: "Heading3" };
      break;
    case "bulleted_list_item":
      Result = { Depth, Markdown, Type: "BulletedListItem" };
      break;
    case "numbered_list_item":
      Result = { Depth, Markdown, Type: "NumberedListItem" };
      break;
    case "to_do":
      Result = {
        Checked: Boolean(Payload?.checked),
        Depth,
        Markdown,
        Type: "ToDo"
      };
      break;
    case "quote":
      Result = { Depth: 0, Markdown, Type: "Quote" };
      break;
    case "code":
      Result = {
        Depth: 0,
        Language: String(Payload?.language ?? "plain text"),
        Markdown: RichTextFromPayload(Payload).map((Item) => {
          const Value = Item;
          const Text = Value.text;
          return Text?.content ?? (typeof Value.plain_text === "string" ? Value.plain_text : "");
        }).join(""),
        Type: "Code"
      };
      break;
    case "divider":
      Result = { Depth: 0, Markdown: "", Type: "Divider" };
      break;
    default:
      Unsupported.Add({
        BlockType: Type,
        DisplayLabel: BlockTypeLabels[Type] ?? Type,
        Reason: Type === "unknown" ? "Unknown" : NotionApiOnly.has(Type) ? "NotionApi" : "NoteFerry"
      });
  }
  if (Result) {
    Output.push(Result);
    for (const Child of ReadChildren(Block, Payload)) {
      AppendNotionBlock(Child, IsListBlock(Result) ? Depth + 1 : 0, Output, Unsupported);
    }
  }
};
var NotionBlocksToMarkdown = (Blocks, Options = {}) => {
  const MarkdownBlocks = [];
  const Unsupported = new UnsupportedCollector();
  for (const Block of Blocks) {
    AppendNotionBlock(Block, 0, MarkdownBlocks, Unsupported);
  }
  const UnsupportedElements = Unsupported.ToArray();
  ThrowIfUnsupported(UnsupportedElements, Options);
  return { Markdown: SerializeMarkdownBlocks(MarkdownBlocks), UnsupportedElements };
};
export {
  ChunkNotionBlocks,
  MarkdownToNotionBlocks,
  MarkdownToNotionRichText,
  MaxNotionBlockChildren,
  NotionBlocksToMarkdown,
  ParseMarkdownBlocks,
  SerializeMarkdownBlocks,
  ThrowIfUnsupported,
  UnsupportedCollector,
  UnsupportedElementError
};
