// content.js

let scrolling = false;
let retryAttemptsLoad = 5; // Set the number of retry attempts for loadMoreComments
let retryAttemptsScroll = 10; // Set the number of retry attempts for scrollDown
let stopRequested = false; // Track if stop is requested

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.action === 'startLoadingComments') {
      stopRequested = false; // Reset stop flag
      loadMoreComments();
      startEmailExtraction();
    } else if (request.action === 'stopLoading') {
      stopRequested = true; // Set stop flag
    }
  }
);

function loadMoreComments() {
  const loadMoreButton = document.querySelector('.comments-comments-list__load-more-comments-button');

  if (loadMoreButton) {
    loadMoreButton.click();
    setTimeout(function () {
      if (!scrolling && !stopRequested) {
        scrollDown();
      }
      if (!stopRequested) {
        loadMoreComments();
      }
    }, 2000); // Adjust the delay as needed
  }
}

function scrollDown() {
  scrolling = true;
  window.scrollBy(0, window.innerHeight);
  setTimeout(function () {
    scrolling = false;
  }, 500); // Adjust the delay as needed

  if (!stopRequested) {
    retryAttemptsScroll--;
    if (retryAttemptsScroll > 0) {
      setTimeout(scrollDown, 500); // Adjust the delay for retry as needed
    } else {
      retryAttemptsScroll = 10; // Reset retry attempts
    }
  }
}

function startEmailExtraction() {
  setInterval(extractEmails, 5000); // Adjust the interval as needed
}

function extractEmails() {
  try {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const pageText = document.body.innerText;
    const emails = pageText.match(emailRegex);

    if (emails && emails.length > 0) {
      sendMessageToPopup(emails);
    }
  } catch (error) {
    console.error('Error extracting emails:', error);
  }
}

function sendMessageToPopup(emails) {
  chrome.runtime.sendMessage({ action: 'updateEmails', emails: emails });
}

// Trigger email extraction when content script is injected
startEmailExtraction();
