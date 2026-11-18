package com.example.Save.File.Drive.Config;

import com.example.Save.File.Drive.Services.JwtService;
import com.example.Save.File.Drive.Services.UserInfoService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtService jwtService;

    private final UserInfoService userInfoService;

    public JwtAuthFilter(JwtService jwtService, UserInfoService userInfoService) {
        this.jwtService = jwtService;
        this.userInfoService = userInfoService;
    }

    // Public APIs (No JWT needed)
    public static final String[] PUBLIC_URLS  = {
    "/register/**",
    "/register/send-otp",
    "/register/verify-otp",
    "/register",
    "/generateToken",
     "/forget-password",
      "/reset-password",
    "/login",
    "/error/**"
};
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String requestURI = request.getRequestURI();
        for (String url : PUBLIC_URLS) {
            if (url.endsWith("/**") && requestURI.startsWith(url.replace("/**", ""))) {
                return true;
            } else if (url.endsWith("/") && requestURI.startsWith(url)) {
                return true;
            } else if (requestURI.equals(url)) {
                return true;
            }
        }
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Allow preflight requests
        if (request.getMethod().equalsIgnoreCase("OPTIONS")) {
            response.setStatus(HttpServletResponse.SC_OK);
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        String token = null;
        String email = null;

        // Extract token
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else if (authHeader != null) {
            sendUnauthorizedError(response, "Invalid Authorization header format. Use: Bearer <token>");
            return;
        } else {
            sendUnauthorizedError(response, "Missing Authorization header");
            return;
        }

        // Extract email from token
        try {
            email = jwtService.extractEmail(token);
            log.info("Extracted Email from Token: {}", email);
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            sendUnauthorizedError(response, "Token has expired");
            return;
        } catch (io.jsonwebtoken.SignatureException e) {
            sendUnauthorizedError(response, "Invalid token signature");
            return;
        } catch (Exception e) {
            // SEND 401 for any other JWT error
            log.error("Error extracting email from token: {}", e.getMessage());
            sendUnauthorizedError(response, "Invalid token");
            return;
        }

        // Validate token
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = userInfoService.loadUserByUsername(email);
                log.info("Loaded user Details: {}", userDetails.getUsername());

                if (jwtService.validateToken(token, userDetails)) {
                    log.info("Token validation successful for: {}", email);

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities()
                            );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    log.error("Token validation failed for: {}", email);
                    sendUnauthorizedError(response, "Token validation failed");
                    return;
                }
            } catch (UsernameNotFoundException e) {
                log.error("User not found: {}", email);
                sendUnauthorizedError(response, "User not found");
                return;
            } catch (Exception e) {
                log.error("Authentication error: {}", e.getMessage());
                sendUnauthorizedError(response, "Authentication failed");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void sendUnauthorizedError(HttpServletResponse response, String message)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");

        String jsonResponse = String.format(
                "{\"error\": \"Unauthorized\", \"message\": \"%s\", \"timestamp\": \"%s\"}",
                message,
                java.time.LocalDateTime.now()
        );

        response.getWriter().write(jsonResponse);
    }
}
