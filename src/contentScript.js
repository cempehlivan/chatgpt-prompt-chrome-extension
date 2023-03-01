'use strict';

document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    setTimeout(creator, 1000);
  }
};

let currentTitle = document.title;

const observer = new MutationObserver((mutations) => {
  if (document.title !== currentTitle) {
    currentTitle = document.title;

    if (document.location.pathname == '/chat') {
      setTimeout(creator, 500);
    }
  }
});

const config = { subtree: true, childList: true };
observer.observe(document, config);

window.addEventListener('beforeunload', function (event) {
  observer.disconnect();
});

const creator = () => {
  var divContainer = document.createElement('div');
  divContainer.setAttribute('class', 'flex flex-1 flex-grow-0 ml-auto mr-auto flex-col pt-5 md:max-w-2xl lg:max-w-3xl');

  const titleElement = document.createElement('h2');
  titleElement.setAttribute('class', 'mb-3');
  titleElement.innerHTML = 'Prompts';
  divContainer.appendChild(titleElement);

  const ulElement = document.createElement('ul');

  ulElement.setAttribute('class', 'flex gap-3.5 overflow-y-auto');
  ulElement.setAttribute(
    'style',
    'flex-wrap: wrap;flex: 1 0 auto; height: 500px; align-items: flex-start;'
  );

  const searchInputElement = document.createElement('input');
  searchInputElement.setAttribute(
    'class',
    'dark:bg-gray-700 dark:text-white mb-6 md:pl-4 md:py-3 relative resize-none rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] w-full'
  );
  searchInputElement.setAttribute('placeholder', 'Search prompts..');
  searchInputElement.onkeyup = (e) => {
    const searchText = e.target.value;
    ulElement.childNodes.forEach(function (itemLi) {
      if (itemLi.innerText.search(new RegExp(searchText, 'i')) < 0) {
        itemLi.style.visibility = 'hidden';
        itemLi.style.display = 'none';
      } else {
        itemLi.style.visibility = '';
        itemLi.style.display = '';
      }
    });
  };

  divContainer.appendChild(searchInputElement);

  const csvText = httpGet(
    `https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv?v=${Date.now()}`
  );

  const promptArray = csvToArray(csvText, '","');

  if (
    promptArray != undefined &&
    promptArray != null &&
    promptArray.length > 0
  ) {
    const textareaElement = document.querySelector('textarea[data-id="root"]');

    for (let index = 0; index < promptArray.length; index++) {
      const prompt = promptArray[index];

      if (
        prompt.prompt == undefined ||
        prompt.prompt == null ||
        prompt.prompt === ''
      ) {
        continue;
      }

      const liElement = document.createElement('li');

      liElement.setAttribute(
        'class',
        'flex-1 bg-gray-50 dark:bg-white/5 p-3 rounded-md hover:bg-gray-200 dark:hover:bg-gray-900 flex items-center justify-center text-center cursor-pointer'
      );
      liElement.setAttribute('style', 'min-width: 30%;');

      liElement.innerHTML = prompt.act;

      liElement.onclick = () => {
        textareaElement.value = prompt.prompt;
        textareaElement.dispatchEvent(new Event('input', { bubbles: true }));
      };

      ulElement.appendChild(liElement);
    }

    divContainer.appendChild(ulElement);
  }

  var h1Element = document.querySelector('h1');
  h1Element.classList.add("mt-6");
  h1Element.classList.remove("flex-grow");

  var h1ElementParent = h1Element.parentNode;

  if (h1ElementParent.lastChild.nodeName != 'H1') {
    h1ElementParent.lastChild.remove();
  }
  h1ElementParent.appendChild(divContainer);
};

const csvToArray = (str, delimiter = ',') => {
  const headers = str
    .slice(0, str.indexOf('\n'))
    .split(delimiter)
    .map((s) => s.replace(/(^"|"$)/g, ''));

  const rows = str.slice(str.indexOf('\n') + 1).split('\n');

  const arr = rows.map(function (row) {
    const values = row.replace(/(^"|"$)/g, '').split(delimiter);
    const el = headers.reduce(function (object, header, index) {
      object[header] = values[index];
      return object;
    }, {});
    return el;
  });

  return arr;
};

const httpGet = (theUrl) => {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open('GET', theUrl, false);
  xmlHttp.send(null);
  return xmlHttp.responseText;
};
