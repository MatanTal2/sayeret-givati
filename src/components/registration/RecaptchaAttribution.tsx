import { TEXT_CONSTANTS } from '@/constants/text';

export default function RecaptchaAttribution() {
  return (
    <p className="text-xs text-neutral-500 text-center px-4 pb-2">
      {TEXT_CONSTANTS.AUTH.RECAPTCHA_ATTRIBUTION_PREFIX}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-neutral-700"
      >
        {TEXT_CONSTANTS.AUTH.RECAPTCHA_PRIVACY_LINK}
      </a>
      {TEXT_CONSTANTS.AUTH.RECAPTCHA_AND}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-neutral-700"
      >
        {TEXT_CONSTANTS.AUTH.RECAPTCHA_TERMS_LINK}
      </a>
      {TEXT_CONSTANTS.AUTH.RECAPTCHA_ATTRIBUTION_SUFFIX}
    </p>
  );
}
