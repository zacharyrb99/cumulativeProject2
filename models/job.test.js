"use strict"

const db = require('../db');
const {BadRequestError, NotFoundError} = require('../expressError');
const Job = require('./job');
const Company = require('./company');

beforeAll(async () => {
    await db.query("DELETE FROM jobs");
    await db.query("DELETE FROM companies");

    await Company.create(
        {
            handle: "c1",
            name: "C1",
            numEmployees: 1,
            description: "Desc1",
            logoUrl: "http://c1.img",
        });
    await Company.create(
        {
            handle: "c2",
            name: "C2",
            numEmployees: 2,
            description: "Desc2",
            logoUrl: "http://c2.img",
        });
    await Company.create(
        {
            handle: "c3",
            name: "C3",
            numEmployees: 3,
            description: "Desc3",
            logoUrl: "http://c3.img",
        });

    await Job.create({
        title: "j1",
        salary: 100000,
        equity: 0,
        company_handle: "c1"
    });
    await Job.create({
        title: "j2",
        salary: 50000,
        equity: 0.5,
        company_handle: "c1"
    });
    await Job.create({
        title: "j3",
        salary: 1000000,
        equity: 0,
        company_handle: "c2"
    });
    await Job.create({
        title: "j4",
        salary: 200000,
        equity: 0,
        company_handle: "c3"
    });
});

beforeEach(async () => {
    await db.query("BEGIN");
});

afterEach(async () => {
    await db.query("ROLLBACK");
});

afterAll(async () => {
    await db.end();
});

describe("create", () => {
    const newJob = {
        title: "testJob",
        salary: 100000,
        equity: "0.1",
        company_handle: "c3"
    }

    test("works", async () => {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            title: "testJob",
            salary: 100000,
            equity: "0.1",
            companyHandle: "c3"
        });
    });
});

describe("findAll", () => {
    test("works no filter", async () => {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "j1",
                salary: 100000,
                equity: "0",
                companyHandle: "c1"
            },
            {
                id: expect.any(Number),
                title: "j2",
                salary: 50000,
                equity: "0.5",
                companyHandle: "c1"
            },
            {
                id: expect.any(Number),
                title: "j3",
                salary: 1000000,
                equity: "0",
                companyHandle: "c2"
            },
            {
                id: expect.any(Number),
                title: "j4",
                salary: 200000,
                equity: "0",
                companyHandle: "c3"
            }
        ]);
    });

    test("works filter title", async () => {
        let jobs = await Job.findAll("j1");
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "j1",
                salary: 100000,
                equity: "0",
                companyHandle: "c1"
            }
        ]);
    });

    test("works filter title, minSalary", async () => {
        let jobs = await Job.findAll("j", 500000);
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "j3",
                salary: 1000000,
                equity: "0",
                companyHandle: "c2"
            }
        ]);
    });

    test("works filter title, minSalary, hasEquity", async () => {
        let jobs = await Job.findAll("j", 10000, true);
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "j2",
                salary: 50000,
                equity: "0.5",
                companyHandle: "c1"
            }
        ]);
    });
});

describe("get", () => {
    test("works", async () => {
        const testJob = await Job.findAll("j1");
        const job = await Job.get(testJob[0].id);

        expect(job).toEqual([{
            title: "j1",
            salary: 100000,
            equity: "0",
            companyHandle: "c1"
        }]);
    });
});

describe("update", () => {
    const updateData = {
        salary: 0
    }

    test("works", async () => {
        const testJob = await Job.findAll("j1");
        let job = await Job.update(testJob[0].id, updateData);
        expect(job).toEqual({
            title: "j1",
            salary: 0,
            equity: "0",
            companyHandle: "c1"
        });
    });
});

describe("delete", () => {
    test("works", async () => {
        const testJob = await Job.findAll('j1');
        await Job.delete(testJob[0].id);
        const res = await db.query("SELECT * FROM jobs WHERE id=$1", [testJob[0].id]);
        expect(res.rows.length).toEqual(0);
    });
});