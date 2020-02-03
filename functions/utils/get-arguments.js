module.exports = function (msg) {
  let regex = /"(.*?)"/gm; // get texts between quotes "example"
  const str = msg;
  let args = [];
  let m;

  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    args.push(m[1]);
  }

  return args;
};