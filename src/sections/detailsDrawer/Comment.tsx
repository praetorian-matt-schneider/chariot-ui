import { useEffect, useState } from 'react';

import { Button } from '@/components/Button';
import { Type } from '@/components/form/Input';
import { InputText } from '@/components/form/InputText';
import { cn } from '@/utils/classname';

interface Props {
  comment: string;
  isLoading: boolean;
  onSave?: (comment: string) => Promise<void>;
  title?: string;
}

export const Comment: React.FC<Props> = ({ comment, onSave }: Props) => {
  const isEditing = true;
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
      setValue('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={cn(
        'transition-all rounded-sm mt-4 bg-gray-100 p-4 cursor-pointer'
      )}
    >
      <InputText
        type={Type.TEXT_AREA}
        name="message"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Write your thoughts here..."
      />
      <div className="mt-2 flex justify-end space-x-2">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};
