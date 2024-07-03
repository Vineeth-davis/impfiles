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