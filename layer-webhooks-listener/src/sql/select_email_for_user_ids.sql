-- https://github.com/brianc/node-postgres/wiki/Parameterized-queries-and-Prepared-Statements#parameters-for-clause-where--in-
SELECT email FROM users WHERE id = ANY($1::int[]);