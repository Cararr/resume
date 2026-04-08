const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");

function copy(src, dest) {
	fs.copyFileSync(path.join(root, src), path.join(root, dest));
}

function run(cmd) {
	execSync(cmd, { stdio: "inherit", cwd: root });
}

const kendallIndex = path.join(root, "themes/kendall/index.js");

function setResumeLang(lang) {
	const content = fs.readFileSync(kendallIndex, "utf8");
	const next = content.replace(
		/const RESUME_LANG = LANGUAGE\.(EN|PL);/,
		`const RESUME_LANG = LANGUAGE.${lang};`,
	);
	if (next === content)
		throw new Error(`Could not set RESUME_LANG to LANGUAGE.${lang} in themes/kendall/index.js`);
	fs.writeFileSync(kendallIndex, next, "utf8");
}

// PL
setResumeLang("PL");
copy("resume.pl.json", "resume.json");
copy("themes/kendall/resume.pl.template", "themes/kendall/resume.template");
run("npm run validate && resume export kamil_kacperek_pl.pdf --theme ./themes/kendall");

// EN
setResumeLang("EN");
copy("resume.en.json", "resume.json");
copy("themes/kendall/resume.en.template", "themes/kendall/resume.template");
run("npm run validate && resume export kamil_kacperek_en.pdf --theme ./themes/kendall");
