fetch("http://localhost:3000/articles")
.then(res => res.json())
.then(data => {

let html = "";

data.forEach(article => {

html += `
<h2>${article.titre}</h2>
<p>${article.contenu}</p>
<img src="${article.image}" width="200">
<hr>
`;

});

document.getElementById("articles").innerHTML = html;

});