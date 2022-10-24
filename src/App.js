import React, {
  useRef,
  useMemo,
  useEffect,
  useCallback,
  useState,
} from "react";
import "./App.css";
import { Editor, createEditor, Transforms, Text, Element, Range } from "slate";

import { Slate, Editable, withReact } from "slate-react";

import { nanoid } from "nanoid";

import { withHistory } from "slate-history";

import { htmlEscape } from "escape-goat";
import parse from "html-react-parser";

// import { initialValue } from "./InitialValue";

const isAdminState = {
  isAdmin: true,
};

const withFields = (editor) => {
  const { isInline, isVoid } = editor;

  editor.isInline = (element) => {
    return element.type === "field" ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === "field" ? true : isVoid(element);
  };

  return editor;
};

const App = () => {
  const [isAdmin, setIsAdmin] = useState(true);
  const [editor] = useState(() =>
    withFields(withReact(withHistory(createEditor())))
  );

  useEffect(() => {
    isAdminState.isAdmin = isAdmin;
  }, [isAdmin]);

  const [fieldsIds, setFieldsIds] = useState([]);
  const [nextFieldOrder, setNextFieldOrder] = useState(0);

  const [currentDocumentHtml, setCurrentDocumentHtml] = useState();

  const templateIdRef = useRef();

  const initialValue = useMemo(
    () =>
      JSON.parse(localStorage.getItem("content")) || [
        {
          type: "paragraph",
          children: [{ text: "A line of text in a paragraph." }],
        },
      ],
    []
  );

  const renderElement = useCallback(({ attributes, children, element }) => {
    switch (element.type) {
      case "field":
        return (
          <span
            {...attributes}
            contentEditable={false}
            style={{ fontWeight: "bold", backgroundColor: "yellow" }}
          >
            {children}
            {element.content}
          </span>
        );

      default:
        return <p {...attributes}>{children}</p>;
    }
  }, []);

  const renderLeaf = useCallback((props) => {
    return <Leaf {...props} />;
  }, []);

  const turnIntoField = () => {
    if (!editor.selection || Range.isCollapsed(editor.selection)) return;
    // Check if there this is already a field

    const [match] = Editor.nodes(editor, {
      match: (n) => Element.isElement(n) && n.type === "field",
    });

    if (match) return;

    // Insert field element
    const fieldContent = Editor.string(editor, editor.selection);
    const fieldId = nanoid();

    Transforms.insertNodes(editor, {
      type: "field",
      id: fieldId,
      content: fieldContent,
      order: nextFieldOrder,
      children: [{ text: "" }],
    });

    setNextFieldOrder((order) => order + 1);
    setFieldsIds((ids) => [...ids, fieldId]);
  };

  const turnIntoEditable = () => {
    if (!editor.selection || Range.isCollapsed(editor.selection)) return;

    Transforms.setNodes(
      editor,
      { editable: true },
      { match: (n) => Text.isText(n), split: true }
    );
  };

  const turnIntoReadonly = () => {
    if (!editor.selection || Range.isCollapsed(editor.selection)) return;

    Transforms.setNodes(
      editor,
      { editable: false },
      { match: (n) => Text.isText(n), split: true }
    );
  };

  const saveTemplate = () => {
    const d = new Date();
    const dFormat = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}_${d.getDate()}-${
      d.getMonth() + 1
    }-${d.getFullYear()}`;

    localStorage.setItem(
      `template - ${dFormat}`,
      JSON.stringify(editor.children)
    );
  };

  const getTemplatesIds = () => {
    const templatesIds = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith("template -")) {
        templatesIds.push(key);
      }
    }
    return templatesIds;
  };

  const getDocumentsIds = () => {
    const documentsIds = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith("document -")) {
        documentsIds.push(key);
      }
    }
    return documentsIds;
  };

  const saveDocument = () => {
    const documentFields = [];

    for (const fieldId of fieldsIds) {
      for (const node of editor.children) {
        if (Element.isElement(node)) {
          for (const childNode of node.children) {
            if (
              Element.isElement(childNode) &&
              childNode.type === "field" &&
              childNode.id === fieldId
            ) {
              documentFields.push({
                fieldId: fieldId,
                fieldValue: childNode.content,
              });
            }
          }
        }
      }
    }

    const document = {
      templateId: templateIdRef.current,
      documentFields,
    };

    const d = new Date();
    const dFormat = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}_${d.getDate()}-${
      d.getMonth() + 1
    }-${d.getFullYear()}`;
    localStorage.setItem(`document - ${dFormat}`, JSON.stringify(document));
  };

  const serializeToHtml = (nodes, fields) => {
    return nodes.map((n) => serializeToHtmlHelper(n, fields)).join("");
  };

  const serializeToHtmlHelper = (node, fields) => {
    if (Text.isText(node)) {
      let textHtml = htmlEscape(node.text);

      /*      if (node.code) {
        textHtml = `<code>${textHtml}</code>`;
      } else {
        if (node.bold) {
          textHtml = `<strong>${textHtml}</strong>`;
        }

        if (node.italic) {
          textHtml = `<em>${textHtml}</em>`;
        }
      }
 */
      return textHtml;
    }

    const children = node.children
      .map((n) => serializeToHtmlHelper(n, fields))
      .join("");

    switch (node.type) {
      case "field":
        return `<span style="fontWeight:bold; backgroundColor:yellow;">${
          fields.find((fieldProps) => {
            return fieldProps.fieldId === node.id;
          })?.fieldValue
        }</span>`;
      default:
        return `<p>${children}</p>`;
    }
  };

  return (
    <Slate
      editor={editor}
      value={initialValue}
      onChange={(value) => {
        const fieldsElements = [];

        for (const node of value) {
          if (Element.isElement(node)) {
            for (const childNode of node.children) {
              if (Element.isElement(childNode) && childNode.type === "field") {
                fieldsElements.push(childNode);
              }
            }
          }
        }

        fieldsElements.sort((a, b) => a.order - b.order);
        setFieldsIds(fieldsElements.map((field) => field.id));

        const isAstChange = editor.operations.some(
          (op) => "set_selection" !== op.type
        );
        if (isAstChange) {
          // Save the value to Local Storage.
          const content = JSON.stringify(value);
          localStorage.setItem("content", content);
        }
      }}
    >
      <label style={{ fontWeight: "bold", margin: 10 }}>
        {isAdmin ? "ADMIN" : "End User"}
      </label>
      <button
        style={{ margin: 10, borderColor: "red" }}
        onClick={() => setIsAdmin((isAdmin) => !isAdmin)}
      >
        {isAdmin ? "Change to End User" : "Change to Admin"}
      </button>
      {isAdmin && (
        <span>
          <button style={{ margin: 10 }} onClick={() => turnIntoField()}>
            Turn into field
          </button>
          <button style={{ margin: 10 }} onClick={() => turnIntoEditable()}>
            Turn into editable
          </button>
          <button style={{ margin: 10 }} onClick={() => turnIntoReadonly()}>
            Turn into readonly
          </button>
          <button style={{ margin: 10 }} onClick={() => saveTemplate()}>
            Save Template
          </button>
        </span>
      )}
      {!isAdmin && (
        <span>
          <button onClick={() => saveDocument()}>Save document</button>
        </span>
      )}
      {
        <div>
          {getTemplatesIds().map((templateId) => (
            <div>
              <button
                style={{ borderColor: "blue", backgroundColor: "white" }}
                key={templateId}
                onClick={() => {
                  templateIdRef.current = templateId;
                  getTemplate();
                  const template = localStorage.getItem(templateIdRef.current);

                  if (template) {
                    const templateValue = JSON.parse(template);

                    // Get initial total nodes to prevent deleting affecting the loop
                    let totalNodes = editor.children.length;

                    // No saved content, don't delete anything to prevent errors
                    if (templateValue.length <= 0) return;

                    // Remove every node except the last one
                    // Otherwise SlateJS will return error as there's no content
                    for (let i = 0; i < totalNodes - 1; i++) {
                      console.log(i);
                      Transforms.removeNodes(editor, {
                        at: [totalNodes - i - 1],
                      });
                    }

                    // Add content to SlateJS
                    for (const value of templateValue) {
                      Transforms.insertNodes(editor, value, {
                        at: [editor.children.length],
                      });
                    }

                    // Remove the last node that was leftover from before
                    Transforms.removeNodes(editor, {
                      at: [0],
                    });
                  }
                }}
              >
                {templateId}
              </button>
            </div>
          ))}
        </div>
      }
      <div>
        {getDocumentsIds().map((documentId) => (
          <div>
            <button
              key={documentId}
              style={{ borderColor: "green", backgroundColor: "white" }}
              onClick={() => {
                const document = localStorage.getItem(documentId);

                if (document) {
                  const documentValue = JSON.parse(document);

                  const template = localStorage.getItem(
                    documentValue.templateId
                  );

                  if (template) {
                    const templateValue = JSON.parse(template);
                    const documentHtml = serializeToHtml(
                      templateValue,
                      documentValue.documentFields
                    );

                    setCurrentDocumentHtml(documentHtml);
                  }
                }
              }}
            >
              {documentId}
            </button>
          </div>
        ))}
      </div>

      <div className="container">
        <Editable
          className="editorArea"
          renderElement={renderElement}
          renderLeaf={renderLeaf}
        />

        <div className="inputArea">
          {fieldsIds.map((fieldId) => (
            <input
              key={fieldId}
              type="text"
              className="field"
              onChange={(e) => {
                Transforms.setNodes(
                  editor,
                  { content: e.target.value },
                  {
                    at: [],
                    match: (node) =>
                      Element.isElement(node) &&
                      node.type === "field" &&
                      node.id === fieldId,
                  }
                );
              }}
            />
          ))}
        </div>
      </div>
      {currentDocumentHtml && (
        <div style={{ margin: 10, borderColor: "red" }}>
          {parse(currentDocumentHtml)}
        </div>
      )}
    </Slate>
  );
};

// Add Bold to this and Toolbar
const Leaf = (props) => {
  return (
    <span
      {...props.attributes}
      contentEditable={
        isAdminState.isAdmin
          ? true
          : props.leaf.editable !== undefined && props.leaf.editable
      }
      style={{
        backgroundColor:
          props.leaf.editable !== undefined && props.leaf.editable
            ? "lightblue"
            : undefined,
      }}
    >
      {props.children}
    </span>
  );
};
export default App;
