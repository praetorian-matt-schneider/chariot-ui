import { useEffect, useRef, useState } from 'react';

interface Props {
  length?: number;
  onSubmit: (otp: string) => void;
}

export const OTPInput = ({ length = 6, onSubmit = () => {} }: Props) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = (index = 0, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      return;
    }

    const newOtp = [...otp];
    // allow only one input
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // submit trigger
    const combinedOtp = newOtp.join('');
    if (combinedOtp.length === length) {
      onSubmit(combinedOtp);
    }

    // Move to next input if current field is filled
    if (value && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleClick = (index: number = 0) => {
    // Move cursor to the start of the input field on click
    inputRefs.current[index].setSelectionRange(1, 1);
  };

  const handleKeyDown = (
    index: number = 0,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Move focus to the previous input field on backspace
    if (e.key === 'Backspace' && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
      setOtp(prevOtp => {
        const newOtp = [...prevOtp];
        newOtp[index] = '';
        return newOtp;
      });
    }
  };

  const handlePaste = (
    index = 0,
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();

    if (pastedData) {
      const newOtp = [...otp].map((value, i) => {
        if (i >= index) {
          return pastedData[i - index];
        }
        return value;
      });
      setOtp(newOtp);
      const nextFocusIndex = Math.min(index + pastedData.length, length - 1);
      inputRefs.current[nextFocusIndex].focus();
      if (newOtp.length === length) {
        onSubmit(newOtp.join(''));
      }
    }
  };

  return (
    <div className="my-8 flex justify-center gap-5">
      {otp.map((value, index) => {
        return (
          <input
            className="h-28 min-w-0 border-2 border-default text-center text-4xl font-bold focus:border-brand"
            key={index}
            onPaste={e => handlePaste(index, e)}
            type="text"
            ref={input => (inputRefs.current[index] = input!)}
            value={value}
            onChange={e => handleChange(index, e)}
            onClick={() => handleClick(index)}
            onKeyDown={e => handleKeyDown(index, e)}
          />
        );
      })}
    </div>
  );
};
