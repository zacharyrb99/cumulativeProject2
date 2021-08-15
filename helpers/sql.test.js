const {sqlForPartialUpdate} = require('./sql');

describe('Test function', () => {
    test('test setCols and values return from function', () => {
        const data = {
            "firstName": "Zach",
            "lastName": "Boudreaux"
        }
        const jsToSql = {
            firstName: "first_name",
            lastName: "last_name"
        }
        const {setCols, values} = sqlForPartialUpdate(data, jsToSql);

        expect(setCols).toEqual(`"first_name"=$1, "last_name"=$2`);
        expect(values).toEqual(['Zach', 'Boudreaux']);
    });
});