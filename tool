First, create a new Django project and a new app for managing products.

sh
Copy code
django-admin startproject sw_version_management
cd sw_version_management
django-admin startapp products
Next, install Django REST Framework and MySQL client:

sh
Copy code
pip install djangorestframework mysqlclient
2. Configuration
Edit your settings.py to include the new app, Django REST Framework, and configure the MySQL database:

python
Copy code
# settings.py

INSTALLED_APPS = [
    ...
    'rest_framework',
    'products',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'your_db_name',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'your_db_host',
        'PORT': 'your_db_port',
    }
}
3. Models
Define the Product model in products/models.py:

python
Copy code
from django.db import models

class Product(models.Model):
    product_line = models.CharField(max_length=100)
    platform = models.CharField(max_length=100)
    customer = models.CharField(max_length=100)
    fab = models.CharField(max_length=100)
    amat_tool_id = models.CharField(max_length=100, null=True, blank=True)
    customer_tool_id = models.CharField(max_length=100, null=True, blank=True)
    current_version = models.CharField(max_length=20)
    date = models.DateField()

    def __str__(self):
        return f"{self.product_line} - {self.platform} - {self.customer}"
4. Serializers
Create a serializer for the Product model in products/serializers.py:

python
Copy code
from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
5. Views
Create viewsets for the Product model in products/views.py:

python
Copy code
from rest_framework import viewsets
from .models import Product
from .serializers import ProductSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
6. URLs
Define URL patterns for the API endpoints in sw_version_management/urls.py and products/urls.py:

python
Copy code
# sw_version_management/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('products.urls')),
]

# products/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
7. Import Products from CSV/JSON
Add a custom action in the ProductViewSet to handle file uploads:

python
Copy code
# products/views.py

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import FileUploadParser
import csv
import json
from io import StringIO

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    @action(detail=False, methods=['post'], parser_classes=[FileUploadParser])
    def import_products(self, request):
        file = request.FILES['file']
        if file.name.endswith('.csv'):
            data = csv.DictReader(StringIO(file.read().decode('utf-8')))
        elif file.name.endswith('.json'):
            data = json.load(file)
        else:
            return Response({'error': 'Unsupported file format'}, status=400)

        products = []
        for row in data:
            product = Product(
                product_line=row['product_line'],
                platform=row['platform'],
                customer=row['customer'],
                fab=row['fab'],
                amat_tool_id=row.get('amat_tool_id'),
                customer_tool_id=row.get('customer_tool_id'),
                current_version=row['current_version'],
                date=row['date'],
            )
            products.append(product)

        Product.objects.bulk_create(products)
        return Response({'status': 'imported'}, status=201)
8. Permissions
Set up permissions based on user roles in products/permissions.py:

python
Copy code
from rest_framework import permissions

class IsProductManagerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'Product Manager'
Apply the permissions to the viewset:

python
Copy code
# products/views.py

from .permissions import IsProductManagerOrReadOnly

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsProductManagerOrReadOnly]

    # import_products action remains unchanged
9. Testing
Write tests to ensure the functionality works as expected.

With this plan, you should have a solid foundation for the Software Version Management tool. Let me know if you'd like to dive into any specific part or need further assistance.





1. Install django-filter
First, install the django-filter package:

sh
Copy code
pip install django-filter
2. Configure Django to use django-filter
Add django_filters to your INSTALLED_APPS in settings.py:

python
Copy code
INSTALLED_APPS = [
    ...
    'django_filters',
]
3. Update the ProductViewSet to support filtering
Modify your ProductViewSet to include a filter backend and define the fields that can be filtered. Create a filter class for more complex filtering logic.

python
Copy code
# products/views.py

from rest_framework import viewsets
from .models import Product
from .serializers import ProductSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import FileUploadParser
import csv
import json
from io import StringIO
import django_filters

class ProductFilter(django_filters.FilterSet):
    class Meta:
        model = Product
        fields = {
            'product_line': ['exact', 'icontains'],
            'platform': ['exact', 'icontains'],
            'customer': ['exact', 'icontains'],
        }

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProductFilter

    @action(detail=False, methods=['post'], parser_classes=[FileUploadParser])
    def import_products(self, request):
        file = request.FILES['file']
        if file.name.endswith('.csv'):
            data = csv.DictReader(StringIO(file.read().decode('utf-8')))
        elif file.name.endswith('.json'):
            data = json.load(file)
        else:
            return Response({'error': 'Unsupported file format'}, status=400)

        products = []
        for row in data:
            product = Product(
                product_line=row['product_line'],
                platform=row['platform'],
                customer=row['customer'],
                fab=row['fab'],
                amat_tool_id=row.get('amat_tool_id'),
                customer_tool_id=row.get('customer_tool_id'),
                current_version=row['current_version'],
                date=row['date'],
            )
            products.append(product)

        Product.objects.bulk_create(products)
        return Response({'status': 'imported'}, status=201)
4. Using the Filtering API
With the above setup, you can filter products by customer using query parameters in your API calls. Here's an example:

API endpoint: /api/products/
HTTP method: GET
Query parameter: ?customer=<customer_name>
For example, to filter products by a customer named "TSMC":

bash
Copy code
GET /api/products/?customer=TSMC
You can also combine multiple filters. For example, to filter by customer "TSMC" and product line "OPWI":

bash
Copy code
GET /api/products/?customer=TSMC&product_line=OPWI
This setup allows you to filter the Product table based on customer, product line, and platform, providing the necessary flexibility for querying the product data.

@action(detail=False, methods=['put'])
    def bulk_update(self, request):
        data = request.data
        if not isinstance(data, list):
            return Response({'error': 'Expected a list of items'}, status=400)

        update_count = 0
        for item in data:
            product_id = item.get('id')
            if not product_id:
                continue

            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                continue

            serializer = ProductSerializer(product, data=item, partial=True)
            if serializer.is_valid():
                serializer.save()
                update_count += 1

        return Response({'status': f'{update_count} products updated'}, status=200)
2. Bulk Update API Call
To update multiple products in bulk, send a PUT request to the bulk_update endpoint with a JSON payload containing a list of product updates. Each item in the list should include the id of the product to be updated and the fields to be updated.

Example Request
Using requests library in Python:

python
Copy code
import requests

url = 'http://yourdomain.com/api/products/bulk_update/'
data = [
    {'id': 1, 'current_version': '10.2.2', 'customer_tool_id': 'CT001'},
    {'id': 2, 'current_version': '10.3.0', 'customer_tool_id': 'CT002'}
]

response = requests.put(url, json=data)
print(response.json())


To integrate LDAP authentication into your Django project, you can use the django-auth-ldap package. This will allow you to configure your LDAP settings and set up the authentication backend. Here's how to do it step by step, using the provided configuration and code snippets as references.

1. Install django-auth-ldap
First, install the django-auth-ldap package:

sh
Copy code
pip install django-auth-ldap
2. Update settings.py
Add the LDAP configuration settings to your settings.py file:

python
Copy code
# settings.py

import ldap
from django_auth_ldap.config import LDAPSearch, GroupOfNamesType

# Baseline configuration.
AUTH_LDAP_SERVER_URI = 'ldaps://USAUSAMATDC01.amat.com:636'
AUTH_LDAP_USER_DN_TEMPLATE = "uid=%(user)s,ou=users,dc=example,dc=com"
AUTH_LDAP_CACHE_TIMEOUT = 300

ldap.set_option(ldap.OPT_DEBUG_LEVEL, 4095)
ldap.set_option(ldap.OPT_X_TLS_REQUIRE_CERT, ldap.OPT_X_TLS_NEVER)
ldap.set_option(ldap.OPT_REFERRALS, ldap.OPT_OFF)
AUTH_LDAP_START_TLS = False

LDAPTLS_CACERT = os.path.join(BASE_DIR, 'AMATRootCA.crt')
LDAP_CA_FILE_PATH = str(BASE_DIR) + os.sep + "AMATRootCA.crt"

AUTH_LDAP_CONNECTION_OPTIONS = {
    ldap.OPT_X_TLS_CACERTFILE: LDAP_CA_FILE_PATH,
    ldap.OPT_X_TLS_REQUIRE_CERT: ldap.OPT_X_TLS_NEVER,
    ldap.OPT_X_TLS_NEWCTX: 0,
}

AUTH_LDAP_BIND_AS_AUTHENTICATING_USER = True

AUTH_LDAP_USER_SEARCH = LDAPSearch(
    "dc=amat,dc=com",
    ldap.SCOPE_SUBTREE,
    "(sAMAccountName=%(user)s)"
)

AUTH_LDAP_USER_ATTR_MAP = {
    "first_name": "givenName",
    "last_name": "sn",
    "email": "mail",
    "employee_id": "employeeID",
    "title": "title",
    "department": "department",
    "username": "sAMAccountName",
}

AUTH_LDAP_USER_FLAGS_BY_GROUP = {
    "is_active": "cn=active,ou=groups,dc=example,dc=com",
    "is_staff": "cn=staff,ou=groups,dc=example,dc=com",
    "is_superuser": "cn=superuser,ou=groups,dc=example,dc=com",
}

AUTHENTICATION_BACKENDS = (
    'django_auth_ldap.backend.LDAPBackend',
    'django.contrib.auth.backends.ModelBackend',
)

# Add other required settings...
3. Create a Login View
Create a view for handling the LDAP login process. Here's an example:

python
Copy code
# views.py

from django.contrib.auth import authenticate, login
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

def ldap_login(request):
    if request.user.is_authenticated:
        return HttpResponseRedirect('/')

    if request.method == 'POST':
        email = request.POST.get('email').lower()
        password = request.POST.get('password')
        user = authenticate(username=email, password=password)
        if user is not None:
            login(request, user)
            return HttpResponseRedirect('/dashboard/')
        else:
            return render(request, 'login.html', {'error': 'Invalid email or password'})

    return render(request, 'login.html')

@login_required
def ldap_logout(request):
    logout(request)
    return HttpResponseRedirect('/login/')
4. Add URLs for Login and Logout
Add the login and logout URLs to your urls.py file:

python
Copy code
# urls.py

from django.urls import path
from .views import ldap_login, ldap_logout

urlpatterns = [
    path('login/', ldap_login, name='login'),
    path('logout/', ldap_logout, name='logout'),
    # Add other URLs...
]
5. Create Login Template
Create a login.html template for the login view:

html
Copy code
<!-- templates/login.html -->

<!DOCTYPE html>
<html>
<head>
    <title>Login</title>
</head>
<body>
    <h2>Login</h2>
    {% if error %}
        <p style="color: red;">{{ error }}</p>
    {% endif %}
    <form method="post" action="{% url 'login' %}">
        {% csrf_token %}
        <label for="email">Email:</label>
        <input type="text" id="email" name="email" required><br>
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required><br>
        <button type="submit">Login</button>
    </form>
</body>
</html>
6. Run the Project
Make sure you have the required LDAP certificates in place and the paths correctly set up in your settings. Then, run your Django server and test the login functionality.

sh
Copy code
python manage.py runserver
Navigate to /login/, and you should be able to log in using your LDAP credentials.

This setup should integrate LDAP authentication into your Django project, allowing users to log in and out using their LDAP credentials. If you need further customization or encounter any issues, feel free to ask!

Since our frontend is hosted seperately. We can use our rest framework only for login and logout also. 
ChatGPT
To use Django REST framework (DRF) for login and logout with LDAP authentication, you can create API endpoints for login and logout. These endpoints can then be consumed by your frontend application. Here’s how you can set it up:

1. Install django-rest-framework and django-rest-auth
First, make sure you have DRF and django-rest-auth installed:

sh
Copy code
pip install djangorestframework django-rest-auth
2. Update settings.py
Make sure you have the necessary configurations in your settings.py:

python
Copy code
# settings.py

INSTALLED_APPS = [
    ...
    'rest_framework',
    'rest_framework.authtoken',
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'rest_auth',
    ...
]

AUTHENTICATION_BACKENDS = (
    'django_auth_ldap.backend.LDAPBackend',
    'django.contrib.auth.backends.ModelBackend',
)

# Add LDAP configuration here...

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
    ),
}

SITE_ID = 1

# Add other required settings...
3. Create API views for login and logout
Create views to handle login and logout:

python
Copy code
# views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated

class LDAPLoginView(APIView):
    def post(self, request):
        email = request.data.get('email').lower()
        password = request.data.get('password')
        user = authenticate(username=email, password=password)
        if user is not None:
            login(request, user)
            token, created = Token.objects.get_or_create(user=user)
            return Response({'token': token.key}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid email or password'}, status=status.HTTP_400_BAD_REQUEST)

class LDAPLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        logout(request)
        return Response(status=status.HTTP_200_OK)
4. Add URLs for the API views
Create URLs for the login and logout API endpoints:

python
Copy code
# urls.py

from django.urls import path
from .views import LDAPLoginView, LDAPLogoutView

urlpatterns = [
    path('api/login/', LDAPLoginView.as_view(), name='api_login'),
    path('api/logout/', LDAPLogoutView.as_view(), name='api_logout'),
]
5. Frontend Integration
For the frontend, you can make HTTP requests to these API endpoints. Here are example requests using JavaScript with the Fetch API:

Login:
javascript
Copy code
const login = async (email, password) => {
    const response = await fetch('http://yourdomain.com/api/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        console.log('Login successful', data);
    } else {
        const errorData = await response.json();
        console.error('Login failed', errorData);
    }
};

// Usage
login('user@example.com', 'password123');
Logout:
javascript
Copy code
const logout = async () => {
    const token = localStorage.getItem('token');

    const response = await fetch('http://yourdomain.com/api/logout/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
        },
    });

    if (response.ok) {
        localStorage.removeItem('token');
        console.log('Logout successful');
    } else {
        console.error('Logout failed');
    }
};

// Usage
logout();
6. Testing the API
Run your Django server and test the API endpoints:

sh
Copy code
python manage.py runserver
Use a tool like Postman or Curl to test the login and logout endpoints to ensure they are working correctly.

By setting up these API endpoints, you can handle LDAP-based login and logout in your Django REST framework backend, and your frontend application can consume these endpoints to authenticate users. If you need any more help or run into issues, feel free to ask!
