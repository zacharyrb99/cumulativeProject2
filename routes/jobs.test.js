"use strict";

const request = require('supertest');
const db = require("../db");
const app = require("../app");
const Company = require('../models/company');
const Job = require('../models/job');
const User = require('../models/user');

const {createToken} = require('../helpers/tokens');

beforeAll(async () => {
    await db.query("DELETE FROM jobs");
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM users");

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

    await User.register({
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        password: "password1",
        isAdmin: false
    });
    await User.register({
        username: "u2",
        firstName: "U2F",
        lastName: "U2L",
        email: "user2@user.com",
        password: "password2",
        isAdmin: true
    });
});

const u1Token = createToken({ username: "u1", isAdmin: false });
const adminToken = createToken({username: "u3", isAdmin: true});

beforeEach(async () => {
    await db.query("BEGIN");
});

afterEach(async () => {
    await db.query("ROLLBACK");
});

afterAll(async () => {
    await db.end();
});

describe("POST /jobs", () => {
    const newJob = {
        title: "test",
        salary: 100000,
        equity: 0,
        company_handle: "c1"
    }

    test("works", async () => {
        const resp = await request(app).post('/jobs')
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({job: {
            title: "test",
            salary: 100000,
            equity: "0",
            companyHandle: "c1"
        }});
    })

    test("fails for non-admin", async () => {
        const resp = await request(app).post('/jobs')
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);

        expect(resp.statusCode).toBe(401);
    });
});

describe("GET /jobs", () => {
    test("works no filter", async () => {
        const resp = await request(app).get('/jobs');
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({
            jobs: [
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
            ]
        });
    });

    test("works filter name", async () => {
        let resp = await request(app).get('/jobs?title=j1');
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({jobs: [
            {
            id: expect.any(Number),
            title: "j1",
            salary: 100000,
            equity: "0",
            companyHandle: "c1"
            }
        ]});
    });

    test("works filter name, minSalary", async () => {
        let resp = await request(app).get('/jobs?title=j&minSalary=500000');
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({jobs: [
            {
            id: expect.any(Number),
            title: "j3",
            salary: 1000000,
            equity: "0",
            companyHandle: "c2"
            }
        ]});
    });

    test("works filter name, minSalary, hasEquity", async () => {
        let resp = await request(app).get('/jobs?title=j&minSalary=10000&hasEquity=true');
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({jobs: [
            {
            id: expect.any(Number),
            title: "j2",
            salary: 50000,
            equity: "0.5",
            companyHandle: "c1"
            }
        ]});
    });

    test("no job found", async () => {
        let resp = await request(app).get('/jobs?title=fdsa');
        expect(resp.statusCode).toBe(400);
    });
});

describe("GET /jobs/:id", () => {
    test("works", async () => {
        let testJob = await Job.findAll("j1");
        let resp = await request(app).get(`/jobs/${testJob[0].id}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({job: [
            {
                title: "j1",
                salary: 100000,
                equity: "0",
                companyHandle: "c1"
            }
        ]});
    });

    test("no company found", async () => {
        let resp = await request(app).get('/jobs/0');
        expect(resp.statusCode).toBe(404);
    })
});

describe("PATCH /jobs/:id", () => {
    const updateData = {
        salary: 0
    }

    test("works for admin", async () => {
        let testJob = await Job.findAll("j1");
        let resp = await request(app).patch(`/jobs/${testJob[0].id}`)
        .send(updateData)
        .set("authorization", `Bearer ${adminToken}`);

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({job: 
            {
                title: "j1",
                salary: 0,
                equity: "0",
                companyHandle: "c1"
            }
        });
    });

    test("fails for non-admin", async () => {
        let testJob = await Job.findAll("j1");
        let resp = await request(app).patch(`/jobs/${testJob[0].id}`)
        .send(updateData)
        .set("authorization", `Bearer ${u1Token}`);

        expect(resp.statusCode).toBe(401);
    });
});

describe("/DELETE /jobs/id", () => {
    test("works for admin", async () => {
        let testJob = await Job.findAll("j1");
        let resp = await request(app).delete(`/jobs/${testJob[0].id}`)
        .set("authorization", `Bearer ${adminToken}`);

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({deleted: `Deleted job with id: ${testJob[0].id}`});
    });

    test("fails for non-admin", async () => {
        let testJob = await Job.findAll("j1");
        let resp = await request(app).delete(`/jobs/${testJob[0].id}`)
        .set("authorization", `Bearer ${adminToken}`);

        expect(resp.statusCode).toBe(401);
    });
});