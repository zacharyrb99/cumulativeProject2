"use strict"

const jsonschema = require('jsonschema');
const express = require('express');

const {BadRequestError} = require('../expressError');
const {ensureAdmin} = require('../middleware/auth');
const Job = require('../models/job');
const jobNewSchema = require('../schemas/jobNew.json');
const jobUpdateSchema = require('../schemas/jobUpdate.json');

const router = express.Router();

router.post('/', ensureAdmin, async (req, res, next) => {
    try{
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if(!validator.valid){
            const errors = validator.errors.map(err => err.stack);
            throw new BadRequestError(errors);
        }

        const job = await Job.create(req.body);
        return res.status(200).json({job});
    } catch(e) {
        return next(e);
    }
});

router.get('/', async (req, res, next) => {
    try{
        const {title, minSalary, hasEquity} = req.query;
        const jobs = await Job.findAll(title, minSalary, hasEquity);
        return res.json({jobs});
    } catch(e) {
        return next(e);
    }
});

router.get('/:id', async (req, res, next) => {
    try{
        const job = await Job.get(req.params.id);
        return res.json({job});
    } catch(e) {
        return next(e);
    }
});

router.patch('/:id', ensureAdmin, async (req, res, next) => {
    try{
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if(!validator.valid) {
            const errors = validator.errors.map(err => err.stack);
            throw new BadRequestError(errors);
        }

        const job = await Job.update(req.params.id, req.body);
        return res.json({job});
    } catch(e) {
        return next(e);
    }
});

router.delete('/:id', ensureAdmin, async (req, res, next) => {
    try {
        await Job.delete(req.params.id);
        return res.json({deleted: `Deleted job with id: ${req.params.id}`})
    } catch(e) {
        return next(e);
    }
});

module.exports = router;