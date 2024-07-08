import React, { useEffect, useState } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

import { Button } from '@/components/Button';
import { CopyToClipboard } from '@/components/CopyToClipboard';
import { InputText } from '@/components/form/InputText';
import { Loader } from '@/components/Loader';
import { OverflowText } from '@/components/OverflowText';
import { cn } from '@/utils/classname';

interface Props {
  title: string;
  subtitle: string;
  isLoading?: boolean;
  onClick?: () => void;
  prefix?: React.ReactNode;
  tag?: React.ReactNode;
  isTitleEditable?: boolean;
  onTitleSubmit?: (title: string) => void;
}

export const DetailsDrawerHeader: React.FC<Props> = ({
  title,
  subtitle,
  isLoading,
  onClick,
  tag,
  prefix,
  isTitleEditable,
  onTitleSubmit,
}: Props) => {
  const [titleState, setTileState] = useState(title);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const isTitleEdited = title !== titleState;

  const showCopyIcon =
    !isTitleEditable || (isTitleEditable && !isTitleFocused && !isTitleEdited);

  useEffect(() => {
    if (!isLoading) {
      setTileState(title);
    }
  }, [isLoading]);

  return (
    <Loader className="h-11" isLoading={isLoading}>
      <header>
        <div
          className={cn(
            'flex items-center',
            isTitleEditable ? 'gap-1' : 'gap-2'
          )}
        >
          {prefix}
          <CopyToClipboard textToCopy={showCopyIcon ? title : ''}>
            <div
              className={cn(
                'flex items-center',
                isTitleEditable ? 'gap-1' : 'gap-2'
              )}
            >
              {isTitleEditable ? (
                <form
                  className="flex"
                  onSubmit={event => {
                    event.preventDefault();
                    onTitleSubmit?.(titleState);
                  }}
                >
                  <InputText
                    className=" overflow-hidden text-ellipsis rounded-r-none px-2 py-1 font-extrabold ring-0 sm:text-2xl"
                    name="detailedDrawerTitle"
                    onChange={event => {
                      setTileState(event.target.value);
                    }}
                    value={titleState}
                    onFocus={() => {
                      setIsTitleFocused(true);
                    }}
                    onBlur={() => {
                      setIsTitleFocused(false);
                    }}
                  />
                  {(isTitleFocused || isTitleEdited) && (
                    <div className="flex">
                      <Button
                        type="submit"
                        className="rounded-none p-2"
                        styleType="primary"
                        startIcon={
                          <CheckIcon className="size-4 stroke-2 [&>path]:stroke-current" />
                        }
                        disabled={!isTitleEdited}
                      />
                      <Button
                        className="rounded-none p-2"
                        startIcon={
                          <XMarkIcon className="size-4 stroke-2 [&>path]:stroke-current" />
                        }
                        disabled={!isTitleEdited}
                        onClick={() => {
                          setTileState(title);
                        }}
                      />
                    </div>
                  )}
                </form>
              ) : (
                <OverflowText
                  text={title}
                  className="text-2xl font-extrabold"
                />
              )}
              {tag}
            </div>
          </CopyToClipboard>
        </div>
        {subtitle && (
          <CopyToClipboard>
            <p
              className={cn(
                'text-sm font-medium text-default-light',
                onClick && 'cursor-pointer'
              )}
              onClick={onClick}
            >
              {subtitle}
            </p>
          </CopyToClipboard>
        )}
      </header>
    </Loader>
  );
};
