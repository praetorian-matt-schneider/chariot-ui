import { Button } from '@/components/Button';

export const SSO = () => {
  return (
    <>
      <div className="relative text-center">
        <hr className="absolute top-2.5 w-full border-t-2 border-default" />
        <span className="relative bg-layer0 px-8 text-center font-semibold">
          OR
        </span>
      </div>
      <Button styleType="secondary" className="w-full">
        Sign Up With Google
      </Button>
    </>
  );
};
