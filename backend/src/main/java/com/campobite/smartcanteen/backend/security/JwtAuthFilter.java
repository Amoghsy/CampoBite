package com.campobite.smartcanteen.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.util.List;
import org.springframework.security.core.GrantedAuthority;

import java.io.IOException;

@Component // ✅ THIS IS CRITICAL
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return request.getServletPath().startsWith("/api/auth");

    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        System.out.println("FILTER ENTRY: " + request.getMethod() + " " + request.getServletPath());

        String header = request.getHeader("Authorization");
        System.out.println("HEADER PRE-CHECK: " + (header != null ? "Present" : "Null"));

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            try {
                String email = jwtService.extractUsername(token);
                // CASE INSENSITIVE CHECK for admin
                boolean isAdmin = email.equalsIgnoreCase("admin@campobite.com");

                List<GrantedAuthority> authorities = isAdmin
                        ? List.of(() -> "ROLE_ADMIN")
                        : List.of(() -> "ROLE_USER");

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        authorities);

                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);

                System.out.println("JWT FILTER HIT: " + request.getServletPath());
                System.out.println("AUTH HEADER: " + request.getHeader("Authorization"));
                System.out.println("USER: " + email + " (isAdmin=" + isAdmin + ") AUTHORITIES: " + authorities);

            } catch (Exception e) {
                System.out.println("JWT FILTER EXCEPTION: " + e.getMessage());
            }
        }

        try {
            filterChain.doFilter(request, response);
            System.out.println("FILTER EXIT: Status=" + response.getStatus());
        } catch (Exception e) {
            System.out.println("FILTER EXCEPTION: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}
