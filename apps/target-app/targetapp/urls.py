from django.contrib import admin
from django.http import HttpResponse
from django.urls import path
from django.views.generic import RedirectView


def healthz(_request):
    return HttpResponse("ok")


urlpatterns = [
    path("healthz", healthz),
    # So a UI smoke test hitting "/" (the generic "app renders something"
    # placeholder in apps/e2e/tests/ui/smoke.spec.ts) gets a real 2xx page
    # instead of Django's 404, without that test needing to know this is
    # specifically an admin app.
    path("", RedirectView.as_view(url="/admin/", permanent=False)),
    path("admin/", admin.site.urls),
]
