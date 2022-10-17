const fs = require('fs');

const MAX = 100 * 1000;
const PATH = `mocks/bigList${MAX}.json`;
console.log(`Soon you wil have data json with MAX = ${MAX}`);

const mockJson = {
  data: [
    {
      name: 'Random',
      number: 0,
    },
  ],
};

for (let i = 0; i < MAX; i++) {
  const tempData = {
    name: 'Element',
    number: i + 1,
  };
  mockJson.data.push(tempData);
}

fs.writeFile(PATH, JSON.stringify(mockJson), (err) => {
  if (err) {
    console.error(err);
    return false;
  }

  console.log('Data written successfully!');
  console.log("Let's read newly written data");
  return true;
});
