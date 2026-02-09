export const authLoginPageHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sign in</title>
    <style>
      :root {
        color-scheme: light;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
          'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji',
          'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', sans-serif;
        background: #f6f7fb;
        color: #111827;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 24px;
      }
      .card {
        width: 100%;
        max-width: 420px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 12px 30px rgba(16, 24, 40, 0.1);
        padding: 32px;
      }
      .title {
        margin: 0 0 8px;
        font-size: 24px;
        font-weight: 700;
      }
      .subtitle {
        margin: 0 0 24px;
        color: #6b7280;
        font-size: 14px;
      }
      .google-button,
      .apple-button,
      .github-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: 100%;
        padding: 12px 16px;
        border-radius: 10px;
        border: 1px solid #e5e7eb;
        background: #ffffff;
        color: #111827;
        font-weight: 600;
        text-decoration: none;
        transition: background 0.2s ease, box-shadow 0.2s ease;
      }
      .google-button:hover,
      .github-button:hover {
        background: #f9fafb;
        box-shadow: 0 6px 16px rgba(16, 24, 40, 0.08);
      }
      .apple-button {
        margin-top: 12px;
        background: #111827;
        color: #ffffff;
        border-color: #111827;
      }
      .apple-button:hover {
        background: #0b1220;
        box-shadow: 0 6px 16px rgba(16, 24, 40, 0.12);
      }
      .github-button {
        margin-top: 12px;
      }
      .google-icon {
        width: 20px;
        height: 20px;
      }
      .apple-icon {
        width: 20px;
        height: 20px;
        fill: currentColor;
      }
      .footer {
        margin-top: 20px;
        font-size: 12px;
        color: #9ca3af;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1 class="title">Welcome back</h1>
      <p class="subtitle">Sign in to continue to Car Trade Hub</p>
      <a class="google-button" href="/auth/google">
        <svg class="google-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 10.2v3.6h5.1c-.2 1.2-1.4 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.4 12 6.4c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.7 4 14.6 3 12 3 7.6 3 4 6.6 4 11s3.6 8 8 8c4.6 0 7.7-3.2 7.7-7.8 0-.5-.1-.9-.1-1.2H12z"
          />
          <path
            fill="#34A853"
            d="M6.3 13.1l-2.8 2.1C4.8 18 8.1 20 12 20c2.6 0 4.8-.9 6.4-2.5l-3.1-2.4c-.8.5-1.8.9-3.3.9-2.6 0-4.8-1.7-5.5-4.1z"
          />
          <path
            fill="#4A90E2"
            d="M19.6 11.2c0-.5-.1-.9-.1-1.2H12v3.6h4.6c-.2 1-1 2.4-2.6 3.1l3.1 2.4c1.8-1.7 2.9-4.1 2.9-6.9z"
          />
          <path
            fill="#FBBC05"
            d="M6.5 9.9c.3-.9.9-1.7 1.7-2.3l-2.8-2.1C4.1 6.7 3.4 8.8 3.4 11s.7 4.3 2 5.5l2.8-2.1c-.6-.6-1-1.4-1.7-2.3-.2-.6-.2-1.5 0-2.2z"
          />
        </svg>
        Continue with Google
      </a>
      <a class="apple-button" href="/auth/apple">
        <svg class="apple-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M16.6 13.2c0-1.8 1.5-2.7 1.6-2.8-.9-1.3-2.3-1.5-2.8-1.5-1.2-.1-2.3.7-2.9.7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.3 2-1.4 2.5-.3 6.2 1 8.2.6 1 1.4 2.2 2.4 2.2 1 0 1.3-.6 2.5-.6 1.2 0 1.5.6 2.5.6s1.7-1 2.4-2c.7-1 1-2 1-2.1 0 0-1.8-.7-1.8-3z"
          />
          <path
            d="M14.8 5.7c.5-.6.8-1.4.7-2.2-.7 0-1.6.5-2.1 1.1-.5.5-.9 1.4-.8 2.2.8.1 1.6-.4 2.2-1.1z"
          />
        </svg>
        Continue with Apple
      </a>
      <a class="github-button" href="/auth/github">
        <svg class="google-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#111827"
            d="M12 2.2c-5.5 0-10 4.5-10 10 0 4.4 2.9 8.1 6.9 9.4.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.2-1.4-1.2-1.4-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1.8-1.1 1.4-1.5-2.2-.2-4.5-1.1-4.5-5 0-1.1.4-2 1.1-2.7-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 2.9 1.1.8-.2 1.7-.3 2.6-.3.9 0 1.8.1 2.6.3 2-1.4 2.9-1.1 2.9-1.1.6 1.5.2 2.6.1 2.9.7.7 1.1 1.6 1.1 2.7 0 3.9-2.3 4.8-4.5 5 .4.3.7 1 .7 2.1v3.1c0 .3.2.6.7.5 4-1.3 6.9-5 6.9-9.4 0-5.5-4.5-10-10-10z"
          />
        </svg>
        Continue with GitHub
      </a>
      <div class="footer">By continuing, you agree to our terms.</div>
    </div>
  </body>
</html>`;
