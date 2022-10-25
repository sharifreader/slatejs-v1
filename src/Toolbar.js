import { Editor, Text, Transforms } from "slate";
import { useSlateStatic } from "slate-react";

export const Toolbar = () => {
  const editor = useSlateStatic();

  const toolbarButtonArray = [
    { textEffect: "bold", buttonLabel: "b" },
    { textEffect: "italic", buttonLabel: "i" },
    { textEffect: "underline", buttonLabel: "_" },
    { textEffect: "code", buttonLabel: "<>" },
  ];

  return (
    <>
      {toolbarButtonArray.map((i) => (
        <button
          onClick={(e) => {
            const [match] = Editor.nodes(editor, {
              match: (n) => Text.isText(n) && n[i.textEffect],
            });
            Transforms.setNodes(
              editor,
              { [i.textEffect]: !match },
              {
                match: (n) => Text.isText(n),
                split: true,
              }
            );
          }}
        >
          {i.buttonLabel}
        </button>
      ))}
    </>
  );
};
