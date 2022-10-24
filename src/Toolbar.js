import { ToolbarButtons } from "./ToolbarButtons";

// Setting Properties from the Toolbar Buttons to be Rendered in the App.js

export const Toolbar = () => {
  const toolbarButtonArray = [
    { textEffect: "bold", buttonLabel: "b" },
    { textEffect: "italic", buttonLabel: "i" },
    { textEffect: "underline", buttonLabel: "_" },
    { textEffect: "code", buttonLabel: "<>" },
  ];

  return (
    <>
      {toolbarButtonArray.map((n) => (
        <ToolbarButtons
          textEffect={`${n.textEffect}`}
          buttonLabel={`${n.buttonLabel}`}
        />
      ))}
    </>
  );
};
