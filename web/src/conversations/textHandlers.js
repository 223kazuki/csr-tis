const previewLink = {
  name: 'preview-link',
  order: 1000,
  handler: (textData, { parts }) => {
    // Hardcode support for SignNow for now
    if (textData.text.indexOf('signnow.com') >= 0) {
      var match = textData.text.match(/>.+</);
      match = match.toString().slice(1, -1);

      textData.afterText.push(
        `<a href='https://${match}' target='_blank' class='linkPreview signnow'>
          <img src='https://www.barracuda.com/assets/signnow/img/layout/logo/signnow.png' width='216' height='90' />
        </a>`
      );
    }
    else {
      return;
    }
  }
};

export default [previewLink];