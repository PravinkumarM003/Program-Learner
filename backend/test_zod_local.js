const { z } = require('zod');

const schema = z.object({
    email: z.string().email(),
    message: z.string().min(1)
});

const result = schema.safeParse({ email: 'bad', message: '' });
console.log('Success:', result.success);
console.log('Error:', result.error);
console.log('Errors:', result.error ? result.error.errors : 'no error');
console.log('Issues:', result.error ? result.error.issues : 'no error');
console.log('Mapped:', result.error ? result.error.errors.map(e => e.message) : 'no error');
