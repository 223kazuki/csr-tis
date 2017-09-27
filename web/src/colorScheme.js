import Color from 'color';

const applyPrimaryColor = (rawColor) => {
  const color = Color(rawColor);
  const colorString = color.toString();
  const desaturated = color.desaturate(0.6);
  const css = `
    a {
      color: ${colorString};
    }
    button.inline {
      color: ${colorString};
    }
    .ConversationCell {
      color: ${desaturated.lighten(1.4).toString()};
    }
    .ConversationCell:hover {
      background-color: ${desaturated.lighten(0.1).toString()};
    }
    .ConversationCell.active,
    .ConversationCell.active:hover,
    .ConversationCell.active:focus {
      background-color: ${desaturated.lighten(1.4).toString()};
    }
    .ConversationCell.active h4 {
      color: ${desaturated.darken(0.4).toString()};
    }
    .ConversationsList {
      background: ${desaturated.darken(0.4).toString()};
    }
    .ConversationListBanner p {
      color: ${desaturated.lighten(0.1).toString()};
    }
    .FilterHeader {
      color: ${desaturated.saturate(0.1).lighten(1).toString()};
    }
    .JumpBar input {
      background: ${desaturated.darken(0.52).toString()};
    }
    layer-composer layer-compose-button-panel layer-send-button {
      color: ${colorString};
    }
    layer-messages-list layer-message-item-sent .layer-list-item layer-message-text-plain {
      background-color: ${colorString};
    }
    .TabController .Tab.selected {
      color: ${colorString};
    }
  `;
  // http://stackoverflow.com/a/524721/472768
  let styleTag = document.getElementById('colorScheme');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.type = 'text/css';
  }
  if (styleTag.styleSheet)
    styleTag.styleSheet.cssText = css;
  else
    styleTag.appendChild(document.createTextNode(css));
  document.body.appendChild(styleTag);
}

export default applyPrimaryColor;