import { Editor, Text, Transforms } from "slate";
import { useSlateStatic } from "slate-react";

export const ToolbarButtons = (props) => {
  const editor = useSlateStatic();
  const textEffect = props.textEffect;
  const buttonLabel = props.buttonLabel;

  console.log("textEffect = " + textEffect);
  console.log("buttonLabel = " + buttonLabel);

  return (
    <button
      onClick={(e) => {
        const [match] = Editor.nodes(editor, {
          match: (n) => Text.isText(n) && n[textEffect],
        });
        Transforms.setNodes(
          editor,
          { [textEffect]: !match },
          {
            match: (n) => Text.isText(n),
            split: true,
          }
        );
      }}
    >
      {buttonLabel}
    </button>
  );
};
