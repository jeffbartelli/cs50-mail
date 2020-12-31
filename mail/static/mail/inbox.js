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
  document.querySelector('#reader-view').style.display = 'none';
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#reader-view').style.display = 'none';
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
  
  // Collect field values
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
  
  // Remove all nodes from mailbox
  document.querySelector("#emails-view").innerHTML = "";

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#reader-view').style.display = 'none';

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
        // Create email item template
        let text = document.createTextNode(`${e.timestamp} | ${e.sender} -  ${e.subject}`);
        let item = document.createElement("li");
        item.classList += "list-group-item d-flex justify-content-between align-items-center text-truncate";
        item.addEventListener("click", () => open_email(e));
        item.appendChild(text);
        // Add 'unread' badge if unread
        if (e.read === false && mailbox !== "sent") {
          let banner = document.createElement("span");
          banner.classList += 'badge badge-primary badge-pill';
          banner.setAttribute("id",`a${e.id}`);
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
    // Modify the Archive button based on mailbox type
    if (mailbox === "inbox") {
      document.querySelector("#archive").style.display = "block";
      document.querySelector("#archive").innerHTML = "Archive";
    } else if (mailbox === "archive") {
      document.querySelector("#archive").style.display = "block";
      document.querySelector("#archive").innerHTML = "Unarchive";
    } else {
      document.querySelector("#archive").style.display = "none";
    }
}

function open_email (email) {
  // Show the reader pane
  document.querySelector('#reader-view').style.display = 'block';

  // Change the email status to read: true
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });

  // Remove the badge from the email and change background color
  if (document.querySelector(`#a${email.id}`) !== null) {
    let badge = document.querySelector(`#a${email.id}`);
    badge.parentNode.style.backgroundColor = 'WhiteSmoke';
    badge.remove();
  }

  // Clear all fields
  document.querySelector('#from').innerHTML = "<strong>From: </strong>";
  document.querySelector('#to').innerHTML = "<strong>To: </strong>";
  document.querySelector('#subject').innerHTML = "<strong>Subject: </strong>";
  document.querySelector('#timestamp').innerHTML = "<strong>Sent On: </strong>";
  document.querySelector('#body').innerHTML = "";

  // Display the email in the div
  document.querySelector('#from').insertAdjacentHTML('beforeend', email.sender);
  document.querySelector('#to').insertAdjacentHTML('beforeend', email.recipients.toString());
  document.querySelector('#subject').insertAdjacentHTML('beforeend', email.subject);
  document.querySelector('#timestamp').insertAdjacentHTML('beforeend', email.timestamp);
  document.querySelector('#body').insertAdjacentHTML('beforeend', email.body);

  // Add event to reply button here, attaching the email.id
  document.querySelector("#reply").addEventListener("click", () => reply_email(email));

  // If email is inbox or archived show these buttons
  document.querySelector("#archive").addEventListener("click", () => archive_email(email.id, document.querySelector("#archive").innerHTML));
}

function reply_email (email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#reader-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  
  // Populate Fields
  document.querySelector('#compose-recipients').value = email.sender;
  let newSubject = email.subject.startsWith("Re: ") ? email.subject : `Re: ${email.subject}`;
  document.querySelector('#compose-subject').value = newSubject;
  document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote: ${email.body}`;
}

function archive_email (id, status) {

  // If archive, then archive, if not then unarchive
  let state = status === 'Archive' ? true : false;
  console.log(state);
  
  // Update archive status
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: state
    })
  })
    .then(load_mailbox('inbox'))
    .then(window.location.reload(true));
}