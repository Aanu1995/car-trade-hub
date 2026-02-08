const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const renderAuthHomePage = (data: unknown): string => {
  const prettyJson = JSON.stringify(data, null, 2);
  const safeJson = escapeHtml(prettyJson);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Signed in</title>
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
        max-width: 720px;
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
        margin: 0 0 16px;
        color: #6b7280;
        font-size: 14px;
      }
      pre {
        background: #0f172a;
        color: #e2e8f0;
        padding: 16px;
        border-radius: 12px;
        overflow: auto;
        font-size: 13px;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1 class="title">Signed in</h1>
      <p class="subtitle">Below is the data returned from Google sign-in.</p>
      <pre>${safeJson}</pre>
    </div>
  </body>
</html>`;
};
