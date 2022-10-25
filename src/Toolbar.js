import { Element, Editor, Text, Transforms } from "slate";
import { useSlateStatic } from "slate-react";

export const Toolbar = () => {
  const editor = useSlateStatic();

  const toolbarLeafButtonArray = [
    { textEffect: "bold", buttonLabel: "b" },
    { textEffect: "italic", buttonLabel: "i" },
    { textEffect: "underline", buttonLabel: "_" },
    { textEffect: "code", buttonLabel: "<>" },
  ];

  const toolbarElementButtonArray = [
    { align: "left", buttonLabel: "l" },
    { align: "right", buttonLabel: "r" },
    { align: "center", buttonLabel: "c" },
    { align: "justify", buttonLabel: "j" },
  ];

  const toolbarElementHeadingArray = [
    { type: "h1", buttonLabel: "H1" },
    { type: "h2", buttonLabel: "H2" },
  ];

  return (
    <>
      {toolbarLeafButtonArray.map((item) => (
        <button
          onClick={(e) => {
            const [match] = Editor.nodes(editor, {
              match: (n) => Text.isText(n) && n[item.textEffect],
            });
            Transforms.setNodes(
              editor,
              { [item.textEffect]: !match },
              {
                match: (n) => Text.isText(n),
                split: true,
              }
            );
          }}
        >
          {item.buttonLabel}
        </button>
      ))}

      {toolbarElementButtonArray.map((item) => (
        <button
          onClick={(e) => {
            Transforms.setNodes(
              editor,
              { align: item.align },
              {
                match: (n) => Editor.isBlock(editor, n),
              }
            );
          }}
        >
          {item.buttonLabel}
        </button>
      ))}

      {toolbarElementHeadingArray.map((item) => (
        <button
          onClick={(e) => {
            const [match] = Editor.nodes(editor, {
              match: (n) => Editor.isBlock(editor, n) && n.type === item.type,
              mode: "highest",
            });

            Transforms.setNodes(
              editor,
              { type: match ? "paragraph" : item.type },
              { match: (n) => Editor.isBlock(editor, n), mode: "highest" }
            );
          }}
        >
          {item.buttonLabel}
        </button>
      ))}
    </>
  );
};
