export async function readJson(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    const looksLikePage = text.trim().startsWith('<');

    if (looksLikePage) {
      throw new Error('Server connection is not available right now. Please try again shortly.');
    }

    throw new Error('Server connection is not available right now. Please try again shortly.');
  }
}
