/**
 * Pure block-document operations used by the rich content editor.
 *
 * @module @noteferry/ui/rich-editor/State
 *
 * @file      State.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    type MarkdownBlock,
    type MarkdownBlockType,
    ParseMarkdownBlocks,
    SerializeMarkdownBlocks,
    type UnsupportedElementDescriptor
} from "@noteferry/notion-markdown";

export interface RichEditorBlock extends MarkdownBlock
{
    readonly Id: string;
}

export interface RichEditorDocument
{
    readonly Blocks: ReadonlyArray<RichEditorBlock>;
    readonly UnsupportedElements: ReadonlyArray<UnsupportedElementDescriptor>;
}

export type RichEditorIdFactory = () => string;

export const CreateEmptyRichEditorBlock = (
    MakeId: RichEditorIdFactory,
    Type: MarkdownBlockType = "Paragraph"
): RichEditorBlock => ({ Depth: 0, Id: MakeId(), Markdown: "", Type });

export const RichEditorDocumentFromMarkdown = (
    Markdown: string,
    MakeId: RichEditorIdFactory
): RichEditorDocument =>
{
    const Parsed = ParseMarkdownBlocks(Markdown);
    return {
        Blocks: Parsed.Blocks.length === 0
            ? [ CreateEmptyRichEditorBlock(MakeId) ]
            : Parsed.Blocks.map((Block) => ({ ...Block, Id: MakeId() })),
        UnsupportedElements: Parsed.UnsupportedElements
    };
};

export const RichEditorDocumentToMarkdown = (
    Blocks: ReadonlyArray<RichEditorBlock>
): string => SerializeMarkdownBlocks(Blocks);

export const UpdateRichEditorBlock = (
    Blocks: ReadonlyArray<RichEditorBlock>,
    Id: string,
    Update: Partial<Omit<RichEditorBlock, "Id">>
): ReadonlyArray<RichEditorBlock> => Blocks.map((Block) =>
    Block.Id === Id ? { ...Block, ...Update } : Block);

export const InsertRichEditorBlock = (
    Blocks: ReadonlyArray<RichEditorBlock>,
    AfterId: string,
    MakeId: RichEditorIdFactory,
    Type: MarkdownBlockType = "Paragraph"
): ReadonlyArray<RichEditorBlock> =>
{
    const Index = Blocks.findIndex((Block) => Block.Id === AfterId);
    const Next = CreateEmptyRichEditorBlock(MakeId, Type);
    if (Index < 0)
    {
        return [ ...Blocks, Next ];
    }
    return [ ...Blocks.slice(0, Index + 1), Next, ...Blocks.slice(Index + 1) ];
};

export const DeleteRichEditorBlock = (
    Blocks: ReadonlyArray<RichEditorBlock>,
    Id: string,
    MakeId: RichEditorIdFactory
): ReadonlyArray<RichEditorBlock> =>
{
    if (Blocks.length <= 1)
    {
        return [ CreateEmptyRichEditorBlock(MakeId) ];
    }
    return Blocks.filter((Block) => Block.Id !== Id);
};

export const MoveRichEditorBlock = (
    Blocks: ReadonlyArray<RichEditorBlock>,
    Id: string,
    Direction: -1 | 1
): ReadonlyArray<RichEditorBlock> =>
{
    const Index = Blocks.findIndex((Block) => Block.Id === Id);
    const Destination = Index + Direction;
    if (Index < 0 || Destination < 0 || Destination >= Blocks.length)
    {
        return Blocks;
    }
    const Next = [ ...Blocks ];
    const [ Item ] = Next.splice(Index, 1);
    if (Item)
    {
        Next.splice(Destination, 0, Item);
    }
    return Next;
};

export const IndentRichEditorBlock = (
    Blocks: ReadonlyArray<RichEditorBlock>,
    Id: string,
    Direction: -1 | 1
): ReadonlyArray<RichEditorBlock> =>
{
    const Index = Blocks.findIndex((Block) => Block.Id === Id);
    const Block = Blocks[Index];
    if (!Block || (Block.Type !== "BulletedListItem"
        && Block.Type !== "NumberedListItem"
        && Block.Type !== "ToDo"))
    {
        return Blocks;
    }
    const PreviousDepth = Index > 0 ? Blocks[Index - 1]?.Depth ?? 0 : 0;
    const Maximum = Index === 0 ? 0 : PreviousDepth + 1;
    const Depth = Math.max(0, Math.min(Maximum, Block.Depth + Direction));
    return UpdateRichEditorBlock(Blocks, Id, { Depth });
};
