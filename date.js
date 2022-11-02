
exports.getDate = function() {
  const d = new Date();
  //let day = weekday[d.getDay()];

  const options = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  };

  return d.toLocaleDateString('en-US', options);


}


exports.getDay = function () {
  const d = new Date();
  //let day = weekday[d.getDay()];

  const options = {
    weekday: 'long',

  };

  return d.toLocaleDateString('en-US', options);


}
