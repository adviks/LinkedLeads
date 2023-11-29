// popup.js

let loadingInterval;
let stopRequested = false;

document.addEventListener('DOMContentLoaded', function () {
  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  const copyButton = document.getElementById('copyButton');
  const downloadButton = document.getElementById('downloadButton'); // Add this line

  startButton.addEventListener('click', function () {
    stopRequested = false;
    startLoading();
  });

  stopButton.addEventListener('click', function () {
    stopRequested = true;
    stopLoading();
  });

  copyButton.addEventListener('click', function () {
    copyEmailsToClipboard();
  });

  downloadButton.addEventListener('click', function () {
    downloadEmails(); // Call the download function when the button is clicked
  });

  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      if (request.action === 'updateEmails') {
        updateEmailsUI(request.emails);
        updateEmailDescription(request.emails.length);
      } else if (request.action === 'loadingStopped') {
        stopLoading();
      }
    }
  );
});

function startLoading() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'startLoadingComments' });
  });

  loadingInterval = setInterval(function () {
    if (!stopRequested) {
      chrome.runtime.sendMessage({ action: 'checkLoadingStatus' }, function (response) {
        if (!response.loading) {
          stopLoading();
        }
      });
    } else {
      stopLoading();
    }
  }, 1000);
}

function stopLoading() {
  clearInterval(loadingInterval);
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'stopLoading' });
  });
}

function updateEmailsUI(emails) {
  const emailsContainer = document.getElementById('emails-container');
  emailsContainer.innerHTML = '';

  if (emails && emails.length > 0) {
    emails.forEach(email => {
      const emailElement = document.createElement('div');
      emailElement.classList.add('email');
      emailElement.textContent = email;
      emailsContainer.appendChild(emailElement);
    });
  } else {
    const noEmailsElement = document.createElement('div');
    noEmailsElement.textContent = 'No emails found.';
    emailsContainer.appendChild(noEmailsElement);
  }
}

function updateEmailDescription(emailCount) {
  const emailDescription = document.getElementById('emailDescription');
  emailDescription.textContent = `Total emails collected: ${emailCount}`;
}

function copyEmailsToClipboard() {
  const emailsContainer = document.getElementById('emails-container');
  const emailsText = Array.from(emailsContainer.getElementsByClassName('email')).map(emailElement => emailElement.textContent).join('\n');

  navigator.clipboard.writeText(emailsText)
    .then(() => {
      console.log('Emails copied to clipboard');
    })
    .catch(error => {
      console.error('Error copying emails to clipboard:', error);
    });
}

function downloadEmails() {
  const emailsContainer = document.getElementById('emails-container');
  const emailsText = Array.from(emailsContainer.getElementsByClassName('email')).map(emailElement => emailElement.textContent).join('\n');

  const blob = new Blob([emailsText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'emails.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
