# Installation


<pre>
    <code id="bash-code">
mkdir wedding-invitator
cd wedding-invitator
mkdir public
mkdir database
    </code>
</pre>

<pre>
  <code id="bash-code">
npm init -y
npm install express sqlite3 socket.io cors
</pre>



# structure


<pre>wedding-comments/
├── public/              # Folder untuk file frontend
│   ├── index.html
│   ├── style.css
│   └── main.js
├── database/           # Folder untuk database
│   └── comments.db
├── server.js          # File utama backend
└── package.json</pre>



# Running Server 


<pre>
  <code id="bash-code">
    node server.js
</pre>
