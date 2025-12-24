const link = document.getElementById('url');
const butt = document.getElementById('btn');
const status = document.getElementById('status');

butt.addEventListener('click', async () => {
  const utube_url = link.value.trim();

  if (!utube_url) {
    alert("enter a valid youtube URL !");
    return;
  }

  status.textContent = 'converting ... ';

  try {
    const response = await fetch('/api/convert', { // no host
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: utube_url })
    });

    if (!response.ok) throw new Error();

    const data = await response.json();

    status.innerHTML = `<a href="${data.downloadurl}" download>Download MP3</a>`;
  } catch {
    status.textContent = 'Conversion failed';
  }
});
