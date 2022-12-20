const calculo = (cant) => {
  const randomsCant = {};
  const randomNumbers = [];
  for (let i = 0; i < cant; i++) {
    let random = parseInt(Math.random() * 1000) + 1;
    randomNumbers.push(random);
    if (!randomsCant[random]) randomsCant[random] = 1;
    else randomsCant[random]++;
  }
  const response = {
    randomsCant,
    randomNumbers,
  };
  return response;
}

process.on("message", ({cant}) => {
  process.send({ ...calculo(cant) });
});
