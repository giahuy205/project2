package DuongGiaHuy._5.project2.config;

import DuongGiaHuy._5.project2.entity.Account;
import DuongGiaHuy._5.project2.service.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final TokenService tokenService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        // Handle preflight CORS requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        if (!(handler instanceof HandlerMethod)) {
            return true;
        }

        HandlerMethod handlerMethod = (HandlerMethod) handler;

        // Check for annotation on method first, then on class
        RequiresRole requiresRole = handlerMethod.getMethodAnnotation(RequiresRole.class);
        if (requiresRole == null) {
            requiresRole = handlerMethod.getBeanType().getAnnotation(RequiresRole.class);
        }


        String authHeader = request.getHeader("Authorization");
        Account account = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            account = tokenService.parseToken(token);
            if (account != null) {
                request.setAttribute("currentUser", account);
            }
        }

        if (requiresRole == null) {
            return true; // Endpoint is public
        }

        if (account == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("text/plain;charset=UTF-8");
            response.getWriter().write("Unauthorized: Missing, expired or invalid token");
            return false;
        }

        String requiredRole = requiresRole.value();
        // If "admin" role is required, user must be "admin".
        if ("admin".equalsIgnoreCase(requiredRole) && !"admin".equalsIgnoreCase(account.getRole())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("text/plain;charset=UTF-8");
            response.getWriter().write("Forbidden: Only admin can access this resource");
            return false;
        }

        return true;
    }
}
