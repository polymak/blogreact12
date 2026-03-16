/**
 * Cloudflare Worker API + Frontend for BlogReact12
 */

import db from './db.js'

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
}

/* ---------------- AUTH ---------------- */

function authenticateToken(request) {
  const authHeader = request.headers.get("Authorization")
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) return false

  return true
}

/* ---------------- CORS ---------------- */

function handleCORS(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS })
  }
  return null
}

/* ---------------- JSON RESPONSE ---------------- */

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  })
}

/* ---------------- API ROUTES ---------------- */

const routes = {

  "GET /api/articles": async () => {
    try {

      const [rows] = await db.execute(
        "SELECT * FROM articles WHERE status='published' ORDER BY date DESC"
      )

      return jsonResponse({
        success: true,
        data: rows,
        count: rows.length
      })

    } catch (e) {

      return jsonResponse({
        success:false,
        error:"Erreur récupération articles"
      },500)

    }
  },

  "GET /api/articles/:id": async (req,params)=>{

    try{

      const [rows] = await db.execute(
        "SELECT * FROM articles WHERE id=? AND status='published'",
        [params.id]
      )

      if(rows.length===0){
        return jsonResponse({
          success:false,
          error:"Article non trouvé"
        },404)
      }

      return jsonResponse({
        success:true,
        data:rows[0]
      })

    }catch(e){

      return jsonResponse({
        success:false,
        error:"Erreur serveur"
      },500)

    }

  },

  "POST /api/login": async request => {

    try{

      const body = await request.json()

      const [rows] = await db.execute(
        "SELECT * FROM users WHERE username=? AND password=?",
        [body.username, body.password]
      )

      if(rows.length===0){

        return jsonResponse({
          success:false,
          message:"Identifiants incorrects"
        },401)

      }

      return jsonResponse({
        success:true,
        token:"demo-token"
      })

    }catch(e){

      return jsonResponse({
        success:false,
        error:"Erreur login"
      },500)

    }

  }

}

/* ---------------- ROUTE MATCHER ---------------- */

function matchRoute(request){

  const url = new URL(request.url)
  const path = url.pathname

  for(const [pattern,handler] of Object.entries(routes)){

    const [method,routePattern] = pattern.split(" ")

    if(method !== request.method) continue

    const regex = new RegExp("^" + routePattern.replace(/:[^/]+/g,"([^/]+)") + "$")

    const match = path.match(regex)

    if(match){

      const params={}
      const names = routePattern.match(/:([^/]+)/g)

      if(names){
        names.forEach((p,i)=>{
          params[p.substring(1)] = match[i+1]
        })
      }

      return { handler, params }

    }

  }

  return null

}

/* ---------------- FRONTEND ROUTER ---------------- */

async function serveFrontend(request){

  const url = new URL(request.url)

  const routes = {
    "/": "index.html",
    "/index.html": "index.html",
    "/login.html": "login.html",
    "/dashboard.html": "dashboard.html",
    "/article.html": "article.html"
  }

  if(routes[url.pathname]){

    const file = routes[url.pathname]

    return fetch(`https://452a54ac.blogreact12.pages.dev/${file}`)

  }

  return null

}

/* ---------------- MAIN FETCH ---------------- */

export default {

  async fetch(request){

    const cors = handleCORS(request)
    if(cors) return cors

    const url = new URL(request.url)

    /* API ROUTES */

    if(url.pathname.startsWith("/api")){

      const match = matchRoute(request)

      if(match){

        try{
          return await match.handler(request,match.params)
        }catch(e){
          return jsonResponse({
            success:false,
            error:"Erreur interne"
          },500)
        }

      }

      return jsonResponse({
        success:false,
        error:"API route inconnue"
      },404)

    }

    /* FRONTEND ROUTES */

    const frontend = await serveFrontend(request)

    if(frontend) return frontend

    return new Response("Page Not Found",{
      status:404
    })

  }

}