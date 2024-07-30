export const Disclaimer = () => {
  return (
    <p className="text-xs text-default-light">
      {`By continuing, you agree to Praetorian's `}
      <a
        href="https://www.praetorian.com/terms-of-service/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-brand"
      >
        Terms of Service
      </a>
      {` and allow the process of my personal data by Praetorian described in our `}
      <a
        href="https://www.praetorian.com/privacy-policy/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-brand"
      >
        Privacy Policy
      </a>
    </p>
  );
};
