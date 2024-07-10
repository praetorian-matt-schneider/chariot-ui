import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

import { Button } from '@/components/Button';
import { CopyToClipboard } from '@/components/CopyToClipboard';
import { InputText } from '@/components/form/InputText';
import { Loader } from '@/components/Loader';
import { OverflowText } from '@/components/OverflowText';
import { Tooltip } from '@/components/Tooltip';
import { cn } from '@/utils/classname';

interface Props {
  name: string;
  label?: string;
  subtitle: string;
  isLoading?: boolean;
  onClick?: () => void;
  prefix?: React.ReactNode;
  tag?: React.ReactNode;
  isTitleEditable?: boolean;
  onTitleSubmit?: (title: string) => void;
}

export const DetailsDrawerHeader: React.FC<Props> = ({
  name,
  label,
  subtitle,
  isLoading,
  onClick,
  tag,
  prefix,
  isTitleEditable,
  onTitleSubmit,
}: Props) => {
  const fakeInputRef = useRef<HTMLDivElement>(null);

  const initialTitle = label || name;
  const isLabelExist = Boolean(label);

  const [width, setWidth] = useState(100);
  const [title, setTitle] = useState(initialTitle);
  const [isTitleEditing, setIsTitleEditing] = useState(false);

  const isTitleEdited = title !== initialTitle;

  useLayoutEffect(() => {
    setWidth(fakeInputRef.current?.clientWidth || 0);
  }, [title, isLoading, isTitleEditing]);

  const inputClassName = cn(
    'w-fit min-h-[46px] max-w-full whitespace-nowrap overflow-hidden text-ellipsis rounded-r-none py-1 font-extrabold ring-0 sm:text-2xl',
    isTitleEditing ? 'pl-2 pr-[84px] min-w-[200px]' : 'px-2'
  );

  useEffect(() => {
    if (!isLoading) {
      setTitle(initialTitle);
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
          <div
            className={cn(
              'flex items-center max-w-full w-full min-h-[46px]',
              isTitleEditable ? 'gap-1' : 'gap-2'
            )}
          >
            {isTitleEditable ? (
              <div className="relative flex max-w-full flex-col pr-4">
                <form
                  className="relative flex"
                  onSubmit={event => {
                    event.preventDefault();
                    setIsTitleEditing(false);
                    onTitleSubmit?.(title);
                  }}
                >
                  <InputText
                    className={cn(
                      inputClassName,
                      'placeholder:sm:text-lg placeholder:font-bold'
                    )}
                    style={{ width: width + 1 }}
                    name="detailedDrawerTitle"
                    onChange={event => {
                      setTitle(event.target.value);
                    }}
                    value={title}
                    onFocus={() => {
                      setIsTitleEditing(true);
                    }}
                    placeholder="Risk Label"
                    required
                  />
                  {isLabelExist && !isTitleEditing && (
                    <Tooltip title={name} placement="top">
                      <div className="absolute right-0 top-0 z-10 -translate-y-1  translate-x-1/2 text-4xl text-red-500">
                        *
                      </div>
                    </Tooltip>
                  )}
                  {isTitleEditing && (
                    <div className="absolute right-[8px] top-0 flex translate-y-[7px] gap-1">
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
                        onClick={() => {
                          setTitle(initialTitle);
                          setIsTitleEditing(false);
                        }}
                      />
                    </div>
                  )}
                </form>
                <div className="absolute left-0 top-0 z-[-1] opacity-0">
                  <div
                    className={cn(inputClassName)}
                    style={{ lineHeight: '1.6' }}
                    ref={fakeInputRef}
                  >
                    {title}
                  </div>
                </div>
              </div>
            ) : (
              <CopyToClipboard textToCopy={title}>
                <OverflowText
                  text={title}
                  className="px-2 py-1 text-2xl font-extrabold"
                />
              </CopyToClipboard>
            )}
            {tag}
          </div>
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
