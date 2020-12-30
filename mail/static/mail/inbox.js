document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#send-email').addEventListener('click', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
  document.querySelector('#alert').style.display = 'none';
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function send_email(e) {

  e.preventDefault();
  
  // Remove any alerts
  document.querySelector('#alert').style.display = 'none';
  document.querySelector('#alert').classList.remove('alert-danger');
  
  // Confirm fields are correctly populated
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  let status;

  // Send email to the API
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => {
    status = response.status;
    return response.json();
  })
  .then(result => {
    // Post the result to a message div with bootstrap class
    document.querySelector('#alert').style.display = 'block';
    // 
    if (status === 201) {
      document.querySelector('#alert').insertAdjacentText('afterbegin', result.message);
      document.querySelector('#alert').classList.add('alert-success');
      // Load Sent Mailbox
      load_mailbox('sent');
      // Hide the compose view and show emails view
      document.querySelector('#emails-view').style.display = 'block';
      document.querySelector('#compose-view').style.display = 'none';
    } else {
      document.querySelector('#alert').insertAdjacentText('afterbegin', result.error);
      document.querySelector('#alert').classList.add('alert-danger');
    }
  })
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // Add the list to the emails-view
      let list = document.createElement("ul");
      list.classList.add('list-group');
      document.querySelector("#emails-view").appendChild(list);
      // Create email item for each returned email
      emails.forEach((e) => {
        // Restructure this to use <a> with onClick attribute. Use bootstrap: https://getbootstrap.com/docs/4.0/components/list-group/
        // Create email item template
        let text = document.createTextNode(`${e.timestamp} | ${e.sender} -  ${e.subject}`);
        let item = document.createElement("li");
        item.classList += "list-group-item d-flex justify-content-between align-items-center text-truncate";
        item.addEventListener("click", () => open_email(e.id));
        item.appendChild(text);
        // Add 'unread' badge if unread
        if (e.read === false) {
          let banner = document.createElement("span");
          banner.classList += "badge badge-primary badge-pill";
          banner.innerHTML = "unread";
          item.appendChild(banner);
        } else {
          // Gray background if already read
          item.style.backgroundColor = 'WhiteSmoke';
        }
        // Add new email item to the list
        list.appendChild(item);
      });
    });
}

function open_email (id) {
  console.log(id);
}