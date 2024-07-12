import { useEffect, useState } from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/Button';

interface Props {
  comment: string;
  isLoading: boolean;
  onSave?: (comment: string) => Promise<void>;
  title?: string;
}

export const Comment: React.FC<Props> = ({ comment, onSave }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(comment);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setValue(comment);
    }
  }, [isEditing, comment]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onSave && (await onSave(value));
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {!isEditing && (
        <>
          {comment ? (
            <p className="whitespace-pre-wrap break-words">{comment}</p>
          ) : (
            <span className="text-gray-500">No comment available</span>
          )}
          <Button styleType="none" onClick={() => setIsEditing(true)}>
            Edit <PencilSquareIcon className="size-5" />
          </Button>
        </>
      )}
      {isEditing && (
        <>
          <textarea
            id="message"
            rows={6}
            value={value}
            onChange={e => setValue(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            placeholder="Write your thoughts here..."
          />
          <div className="mt-2 flex justify-end space-x-2">
            <Button onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </>
      )}
    </>
  );
};
