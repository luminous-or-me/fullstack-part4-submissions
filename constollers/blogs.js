const blogsRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({})
    response.json(blogs)
})

const getTokenFrom = request => {
    const authorization = request.get('authorization')

    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        return authorization.substring(7)
    }

    return null
}

blogsRouter.post('/', async (request, response, next) => {
    const body = request.body

    const token = getTokenFrom(request)
    const decodedToken = jwt.decode(token, process.env.SECRET)
    if (!decodedToken || !decodedToken.id) {
        return response.status(401).send({ error: 'token missing or invalid' })
    }

    const user = await User.findById(decodedToken.id)

    const blog = new Blog({
        ...body,
        likes: body.likes || 0,
        user: user._id
    })

    const savedBlog = await blog.save()

    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', async (request, response, next) => {
    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
})

blogsRouter.put('/:id', async (request, response, next) => {
    const body = { ...request.body }

    if (!body.title) {
        return response.status(400).send({ error: "title missing" })
    }

    if (!body.url) {
        return response.status(400).send({ error: "url missing" })
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
        request.params.id,
        body,
        { new: true, runValidators: true, context: 'query' }
    )

    response.json(updatedBlog)
})

module.exports = blogsRouter