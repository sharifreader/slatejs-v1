import { Editor, Text, Transforms } from "slate";
import { useSlateStatic } from "slate-react";
import { ToolbarButtons } from "./ToolbarButtons";

// Setting Properties from the Toolbar Buttons to be Rendered in the App.js

export const Toolbar = () => {
  const editor = useSlateStatic();

  return (
    <>
      <button
        onClick={(e) => {
          const [match] = Editor.nodes(editor, {
            match: (n) => Text.isText(n) && n.bold,
          });
          Transforms.setNodes(
            editor,
            { bold: !match },
            {
              match: (n) => Text.isText(n),
              split: true,
            }
          );
        }}
      >
        B
      </button>

      <ToolbarButtons textEffect="bold" buttonLabel="b" />
      <ToolbarButtons textEffect="italic" buttonLabel="i" />
      <ToolbarButtons textEffect="code" buttonLabel="<>" />
      <ToolbarButtons textEffect="underline" buttonLabel="_" />
    </>
  );
};
