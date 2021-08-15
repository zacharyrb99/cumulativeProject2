"use strict"

const db = require('../db');
const {BadRequestError, NotFoundError} = require("../expressError");
const {sqlForPartialUpdate} = require('../helpers/sql');

class Job{
    /*
        Create a job, update db, return new job

        data sent should be {title, salary, equity, company_handle}

        returns {title, salary, equity, company_handle}
    */
    static async create({title, salary, equity, company_handle}){
        const duplicateCheck = await db.query(
            `SELECT title, company_handle FROM jobs WHERE title=$1 AND company_handle=$2`, [title, company_handle]);

        if(duplicateCheck.rows[0]){
            throw new BadRequestError(`Duplicate job exists: ${title} at ${company_handle}`);
        }

        const result = await db.query(
            `INSERT INTO jobs (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4) RETURNING title, salary, equity, company_handle AS "companyHandle"`, 
            [title, salary, equity, company_handle]);
        
        const job = result.rows[0];
        return job;
    }

    /*
        Find all companies, or filter companies

        returns [{title, salary, equity, company_handle}, ...]}

        can filter by title, minSalary, and hasEquity
    */
    static async findAll(title, minSalary, hasEquity){
        if(!title && !minSalary && !hasEquity){
            const jobs = await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs`);
            return jobs.rows;
        }else if(title && !minSalary && !hasEquity){
            const jobs = await db.query(
                `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs
                WHERE LOWER(title) LIKE $1`, [`%${title}%`]);
            
            if(jobs.rows.length === 0){
                throw new BadRequestError('No jobs fit those parameters');
            }

            return jobs.rows;
        }else if(title && minSalary && !hasEquity){
            const jobs = await db.query(
                `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs
                WHERE LOWER(title) LIKE $1 AND salary > $2`, 
                [`%${title}%`, minSalary]);
            
            if(jobs.rows.length === 0){
                throw new BadRequestError('No jobs fit those parameters');
            }

            return jobs.rows;
        }else if(title && !minSalary && hasEquity){
            const jobs = await db.query(
                `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs 
                WHERE LOWER(title) LIKE $1 AND equity > 0`, 
                [`%${title}%`]);
            
            if(jobs.rows.length === 0){
                throw new BadRequestError('No jobs fit those parameters');
            }

            return jobs.rows;
        }else if(!title && minSalary && !hasEquity){
            const jobs = await db.query(
                `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs 
                WHERE salary > $1`, [minSalary]);
            
            if(jobs.rows.length === 0){
                throw new BadRequestError('No jobs fit those parameters');
            }

            return jobs.rows;
        }else if(!title && !minSalary && hasEquity){
            const jobs = await db.query(
                `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE equity > 0`)
            
            if(jobs.rows.length === 0){
                throw new BadRequestError('No jobs fit those parameters');
            }

            return jobs.rows;
        }else if(!title && minSalary && hasEquity){
            const jobs = await db.query(
                `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs 
                WHERE salary > $1 AND equity > 0`, [minSalary]);
            
            if(jobs.rows.length === 0){
                throw new BadRequestError('No jobs fit those parameters');
            }

            return jobs.rows;
        }else if(title && minSalary && hasEquity){
            const jobs = await db.query(
                `SELECT id, title, salary, equity, company_handle AS "companyHandle" 
                FROM jobs WHERE LOWER(title) LIKE $1 AND salary > $2 AND equity > 0`,
                [`%${title}%`, minSalary]);
            
            if(jobs.rows.length === 0){
                throw new BadRequestError('No jobs fit those parameters');
            }

            return jobs.rows;
        }
    }

    /*
        Given a job ID, return with the job
    */
    static async get(id){
        const jobs = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle" FROM jobs 
            WHERE id=$1`, [id]);

        const job = jobs.rows[0];

        if(!job) throw new NotFoundError(`No job with id ${id}`);

        return jobs.rows;
    }

    /*
        Given a job ID and data, update the job with data

        Data can include: {title, salary, equity, company_handle}

        returns {title, salary, equity, company_handle}
    */
   static async update(id, data){
       const {setCols, values} = sqlForPartialUpdate(data, {companyHandle: "company_handle"});
       const idIndex = `$${values.length + 1}`;
       const sql = `UPDATE jobs SET ${setCols} WHERE id=${idIndex} RETURNING title, salary, equity, company_handle AS "companyHandle"`;
       console.log(sql);
       const result = await db.query(sql, [...values, id]);

       if(!result.rows[0]) throw new NotFoundError(`No company with id: ${id}`);

       return result.rows[0];
   }

   /*
        Given an id, delete the job
   */
   static async delete(id){
        const result = await db.query(`DELETE FROM jobs WHERE id=$1 RETURNING title, salary, equity, company_handle AS "companyHandle"`, [id]);
        if(!result.rows[0]) throw new NotFoundError(`No company with id: ${id}`);
        return result.rows[0];
   }    
}

module.exports = Job;