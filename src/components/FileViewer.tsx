import React, { useEffect, useState } from 'react';

import { Loader } from '@/components/Loader';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { useOpenFile } from '@/hooks/useFiles';

const FileViewer = ({
  fileName,
  fileType,
}: {
  fileName: string;
  fileType: string;
}) => {
  const { mutate: getFileContent, data: fileContent } = useOpenFile();
  const [editorContent, setEditorContent] = useState('');

  useEffect(() => {
    if (fileName) {
      getFileContent({ name: fileName });
    }
  }, [fileName, getFileContent]);

  useEffect(() => {
    if (fileContent) {
      if (fileType === 'image') {
        setEditorContent('');
      } else {
        // Handling non-image files, converting blob to text
        const reader = new FileReader();
        reader.onload = function (event) {
          if (event.target) {
            setEditorContent(event.target.result as string);
          }
        };
        reader.readAsText(fileContent);
      }
    }
  }, [fileContent, fileType]);
  // Rest of the code...

  // Conditional rendering based on content type
  if (!fileContent) {
    return <Loader isLoading />;
  }

  if (fileType === 'image') {
    const url = URL.createObjectURL(fileContent);
    return <img src={url} alt="File content" />;
  } else {
    return (
      <div className="h-[60vh]">
        <MarkdownEditor
          value={editorContent}
          onChange={value => {
            setEditorContent(value || '');
          }}
          filePathPrefix="proof-of-exploit/files"
        />
      </div>
    );
  }
};

export default FileViewer;
